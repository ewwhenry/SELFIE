"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const [showPassword, setShowingPassword] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const router = useRouter();
  const passwordsMatch = password === confirmPassword;

  const isSubmittable =
    email.trim().length > 0 && password.length > 0 && passwordsMatch;

  const handleForm = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await registerUser({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
      });

      router.replace("/dashboard");
    } catch (_error) {}
  };

  const toggleShowPassword = (v: boolean) => setShowingPassword(v);
  return (
    <section className="w-full h-full max-w-sm mx-auto flex flex-col items-center justify-center *:w-full">
      <h1 className="text-center text-2xl">Sign up</h1>
      <p className="text-sm text-center mt-2 text-muted-foreground">
        You must be approved by the admin to start using your account.
      </p>
      <form onSubmit={(e) => handleForm(e)}>
        <div className="grid grid-cols-2 gap-x-2">
          <div className="mt-10 gap-y-2 flex flex-col">
            <Label>First name</Label>
            <Input
              required
              name="first_name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="mt-10 gap-y-2 flex flex-col">
            <Label>Last name</Label>
            <Input
              required
              name="last_name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-7 gap-y-2 flex flex-col">
          <Label>Email</Label>
          <Input
            required
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mt-7 gap-y-2 flex flex-col">
          <Label>Password</Label>
          <Input
            required
            name="password"
            type={!showPassword ? "password" : "text"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mt-7 gap-y-2 flex flex-col">
          <Label>Confirm password</Label>
          <Input
            required
            type={!showPassword ? "password" : "text"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {!passwordsMatch && (
            <Label className="text-red-400">Passwords dont match.</Label>
          )}
          <div className="flex flex-row gap-x-2 items-center">
            <Checkbox onCheckedChange={(v) => toggleShowPassword(Boolean(v))} />

            <Label className="text-muted-foreground text-sm">
              Show password
            </Label>
          </div>
        </div>
        <div className="mt-7 gap-y-2 flex flex-col">
          <Button disabled={!isSubmittable}>Sign up</Button>
        </div>
      </form>
    </section>
  );
}
