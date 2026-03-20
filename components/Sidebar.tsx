"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Finance", href: "/finance" },
  { label: "Career", href: "/career" },
  { label: "Academics", href: "/academics" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "AI Coach", href: "/voice" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isOnboarding = pathname === "/onboarding";
  const isLogin = pathname === "/login";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("scholar_profile");
    router.push("/");
  };

  if (isHome || isOnboarding || isLogin) return null;

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col z-50"
      style={{ backgroundColor: "#004F9F" }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/dashboard" className="text-xl font-bold text-white tracking-tight">
          Scholar<span style={{ color: "#FFB81C" }}>Sync</span>
        </Link>
        <p className="text-xs text-white/50 mt-0.5">NCAT Career & Finance</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all"
              style={
                active
                  ? { backgroundColor: "#FFB81C", color: "#003a75", fontWeight: 700 }
                  : { color: "rgba(255,255,255,0.75)" }
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="px-4 py-4 border-t border-white/10 flex flex-col gap-1">
        <Link href="/settings" className="flex items-center px-4 py-2 rounded-lg text-sm transition-all" style={{ color: "rgba(255,255,255,0.6)" }}>
          Settings
        </Link>
        <Link href="/help" className="flex items-center px-4 py-2 rounded-lg text-sm transition-all" style={{ color: "rgba(255,255,255,0.6)" }}>
          Help & Support
        </Link>
<button onClick={handleSignOut} className="flex items-center px-4 py-2 rounded-lg text-sm text-left transition-all" style={{ color: "rgba(255,255,255,0.6)" }}>
          Log Out
        </button>
      </div>
    </aside>
  );
}
