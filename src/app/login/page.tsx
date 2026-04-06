'use client'

import Login from "@/components/Login";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import FullPageLoader from "@/components/Generic/FullPageLoader";
import { Suspense, useEffect } from "react";

export default function Page() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = ["admin", "super admin"].includes(
        session?.user.role.toLowerCase() || "user"
      )
        ? `/dashboard`
        : `/assessments`;
      redirect(callbackUrl);
    }
  }, [status, session]);

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Login />
    </Suspense>
  );
}