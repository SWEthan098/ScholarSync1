"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noSidebar = pathname === "/" || pathname === "/onboarding";

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
