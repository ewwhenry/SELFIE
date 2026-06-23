import { execSync, spawn } from "node:child_process";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware.js";

let tunnelProcess: ReturnType<typeof spawn> | null = null;

function checkInstalled(): { installed: boolean; version?: string } {
  try {
    const output = execSync("cloudflared version", {
      encoding: "utf-8",
      timeout: 5000,
    });
    const version = output.trim().split(" ").pop();
    return { installed: true, version };
  } catch {
    return { installed: false };
  }
}

function checkRunning(): boolean {
  if (tunnelProcess && !tunnelProcess.killed) {
    return true;
  }
  try {
    execSync("pgrep -x cloudflared", { encoding: "utf-8", timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

const app = new Hono();

app.get("/status", authMiddleware, async (c) => {
  const installed = checkInstalled();
  const running = installed.installed && checkRunning();

  let tunnelName = "";

  if (running) {
    try {
      const output = execSync("cloudflared tunnel info", {
        encoding: "utf-8",
        timeout: 5000,
      });
      const match = output.match(/^(.+?)\s+/m);
      tunnelName = match?.[1]?.trim() ?? "";
    } catch {
      // tunnel info may fail if not configured
    }
  }

  return c.json({
    data: {
      ...installed,
      running,
      tunnelName,
    },
  });
});

app.post("/start", authMiddleware, async (c) => {
  const { tunnelName } = await c.req.json();

  if (!tunnelName) {
    c.status(400);
    return c.json({ message: "tunnelName is required" });
  }

  if (checkRunning()) {
    c.status(409);
    return c.json({ message: "Tunnel is already running" });
  }

  const installed = checkInstalled();

  if (!installed.installed) {
    c.status(500);
    return c.json({ message: "cloudflared is not installed on this server" });
  }

  try {
    tunnelProcess = spawn("cloudflared", ["tunnel", "run", tunnelName], {
      stdio: "pipe",
    });

    tunnelProcess.on("error", () => {
      tunnelProcess = null;
    });

    tunnelProcess.on("exit", () => {
      tunnelProcess = null;
    });

    c.status(200);
    return c.json({ message: `Tunnel '${tunnelName}' started` });
  } catch {
    c.status(500);
    return c.json({ message: "Failed to start tunnel" });
  }
});

app.post("/stop", authMiddleware, async (c) => {
  if (tunnelProcess && !tunnelProcess.killed) {
    tunnelProcess.kill("SIGTERM");
    tunnelProcess = null;
    return c.json({ message: "Tunnel stopped" });
  }

  // fallback: kill any cloudflared process
  try {
    execSync("pkill -x cloudflared", { timeout: 3000 });
    return c.json({ message: "Tunnel stopped" });
  } catch {
    c.status(404);
    return c.json({ message: "No running tunnel found" });
  }
});

export default app;
