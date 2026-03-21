"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Finance", href: "/finance" },
  { label: "Career", href: "/career" },
  { label: "Academics", href: "/academics" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "AI Coach", href: "/voice" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isOnboarding = pathname === "/onboarding";

  if (isHome || isOnboarding) return null;

  return (
    <nav
      className="w-full border-b border-gray-200 px-6 py-0"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
        <Link href="/" className="text-lg font-bold tracking-tight" style={{ color: "#012169" }}>
          Scholar<span style={{ color: "#E31837" }}>Sync</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={
                  active
                    ? { backgroundColor: "#E31837", color: "#fff" }
                    : { color: "#012169" }
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
