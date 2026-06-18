"use client";

import { useRouter } from "next/navigation";
import { createContext, useEffect, useState } from "react";
import { getUser } from "@/lib/api";
import type { APICurrentUser } from "@/types/API";

type UserContextType = {
  user: APICurrentUser;
};

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<APICurrentUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    getUser()
      .then((userdata) => {
        setUser(userdata.data);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (!user) return <>Loading...</>;

  return (
    <UserContext.Provider
      value={{
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
