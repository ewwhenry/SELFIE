"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const [showPassword, setShowingPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();

  const isSubmittable = email.trim().length > 0 && password.length > 0;

  const handleForm = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await loginUser(email, password);
      router.replace("/dashboard");
    } catch (_error) {}
  };

  const toggleShowPassword = (v: boolean) => setShowingPassword(v);
  return (
    <section className="w-full h-full max-w-sm mx-auto flex flex-col items-center justify-center *:w-full">
      <h1 className="text-center text-2xl">Log in</h1>
      <p className="text-sm text-center mt-2 text-muted-foreground">
        Access to your stored data from everywhere.
      </p>
      <form onSubmit={(e) => handleForm(e)}>
        <div className="mt-10 gap-y-2 flex flex-col">
          <Label>Email</Label>
          <Input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mt-7 gap-y-2 flex flex-col">
          <Label>Password</Label>
          <Input
            name="password"
            type={!showPassword ? "password" : "text"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mt-7 gap-y-2 flex flex-col">
          <div className="flex flex-row gap-x-2 items-center">
            <Checkbox onCheckedChange={(v) => toggleShowPassword(Boolean(v))} />

            <Label className="text-muted-foreground text-sm">
              Show password
            </Label>
          </div>
        </div>
        <div className="mt-7 gap-y-2 flex flex-col">
          <Button disabled={true && !isSubmittable}>Log in</Button>
        </div>
      </form>
    </section>
  );
}
