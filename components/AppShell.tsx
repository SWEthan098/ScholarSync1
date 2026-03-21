"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";

const PUBLIC_PATHS = ["/", "/onboarding", "/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const noSidebar = pathname === "/" || pathname === "/onboarding" || pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      router.push("/login");
    }
    if (user && pathname === "/login") {
      router.push("/dashboard");
    }
  }, [user, loading, pathname, router]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" style={{ borderTopColor: "#004F9F" }} />
        <p className="text-sm text-gray-400 font-medium">Loading ScholarSync...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        key={pathname}
        className={`flex-1 ${noSidebar ? "" : "ml-64 p-8"} page-enter`}
      >
        {children}
      </main>
    </div>
  );
}
