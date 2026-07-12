"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { useAuth } from "@/lib/auth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === false) router.replace("/login");
  }, [isAuthenticated, router]);

  // `null` means we haven't finished reading the stored token yet — render
  // nothing rather than flashing the console to a signed-out user.
  if (isAuthenticated !== true) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="atmosphere relative px-8 pb-12 pt-8">
          <div className="relative z-10 flex flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
