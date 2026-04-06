'use client'

import Login from "@/components/Login";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import FullPageLoader from "@/components/Generic/FullPageLoader";
import { Suspense, useEffect } from "react";

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const dest = ["admin", "super admin"].includes(
        session?.user.role.toLowerCase() || "user",
      )
        ? "/dashboard"
        : "/election-results";
      router.replace(dest);
    }
  }, [status, session, router]);

  if (status === "loading" || status === "authenticated") {
    return <FullPageLoader />;
  }

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Login />
    </Suspense>
  );
}