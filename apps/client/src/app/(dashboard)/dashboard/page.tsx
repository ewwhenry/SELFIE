"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/api";
import type { SuccessAPIResponse } from "@/types/API";

export default function DashboardPage() {
  const [user, setUser] = useState<
    SuccessAPIResponse<{
      id: string;
      email: string;
      role: string;
      usedBytes: string;
      quotaBytes: string;
    }>
  >();

  useEffect(() => {
    getUser().then((res) => setUser(res));
  }, []);
  return user ? user.data.email : <>Loading...</>;
}
