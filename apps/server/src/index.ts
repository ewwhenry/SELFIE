import { serve } from "@hono/node-server";
import app from "./app";
import { PORT } from "./config";

const server = serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  () => console.log(`Server running on http://localhost:${PORT}`),
);

process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
