"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

interface Profile {
  name: string;
  major: string;
  year: string;
  careerInterest: string;
}

const CAREER_OPTIONS = [
  "Software Engineer",
  "Cybersecurity Analyst",
  "Cloud Engineer",
  "Data Scientist",
  "AI / ML Engineer",
];

const YEAR_OPTIONS = ["Freshman", "Sophomore", "Junior", "Senior"];

const NOTIFICATION_DEFAULTS = {
  scholarshipDeadlines: true,
  internshipMatches: true,
  aiInsights: false,
  weeklyDigest: true,
};

export default function Settings() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const [profile, setProfile] = useState<Profile>({
    name: "", major: "", year: "", careerInterest: "",
  });
  const [notifications, setNotifications] = useState(NOTIFICATION_DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "connections" | "notifications" | "account">("profile");

  useEffect(() => {
    const stored = localStorage.getItem("scholar_profile");
    if (stored) setProfile(JSON.parse(stored));
    const notifStored = localStorage.getItem("scholar_notifications");
    if (notifStored) setNotifications(JSON.parse(notifStored));
  }, []);

  const handleProfileSave = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("scholar_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleNotif = (key: keyof typeof NOTIFICATION_DEFAULTS) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem("scholar_notifications", JSON.stringify(updated));
  };

  const handleDeleteAccount = () => {
    localStorage.clear();
    router.push("/");
  };

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: "profile",       label: "Profile"        },
    { id: "connections",   label: "Connections"    },
    { id: "notifications", label: "Notifications"  },
    { id: "account",       label: "Account"        },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <span style={{ color: "#004F9F" }}>Settings</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "#004F9F" }}>Settings</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors"
            style={
              activeTab === tab.id
                ? { color: "#004F9F", borderBottom: "2px solid #004F9F" }
                : { color: "#9ca3af" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Profile ─────────────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-base mb-5" style={{ color: "#004F9F" }}>Personal Information</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. Jordan Smith"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Major</label>
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Year in School</label>
                  <select
                    value={profile.year}
                    onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  >
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Career Interest</label>
                  <select
                    value={profile.careerInterest}
                    onChange={(e) => setProfile({ ...profile, careerInterest: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  >
                    <option value="">Select career</option>
                    {CAREER_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#004F9F" }}
            >
              Save Changes
            </button>
            {saved && <span className="text-sm font-medium text-green-600">Saved ✓</span>}
          </div>
        </form>
      )}

      {/* ── Connections ─────────────────────────────────────────────────────── */}
      {activeTab === "connections" && (
        <div className="flex flex-col gap-4">
          {/* Bank */}
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 mb-0.5">Bank Account</p>
              <p className="text-sm text-gray-500">Connect via Plaid to track spending and financial health.</p>
            </div>
            <button
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#004F9F" }}
            >
              Connect Bank
            </button>
          </div>

          {/* School portal */}
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 mb-0.5">Aggie Access (NCAT)</p>
              <p className="text-sm text-gray-500">Sync your schedule, transcript, and tuition via Microsoft SSO.</p>
            </div>
            <button
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#004F9F" }}
            >
              Connect Portal
            </button>
          </div>

          {/* levels.fyi */}
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 mb-0.5">levels.fyi Salary Data</p>
              <p className="text-sm text-gray-500">Entry-level salary data is pulled automatically. Last synced today.</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700">Active</span>
          </div>
        </div>
      )}

      {/* ── Notifications ───────────────────────────────────────────────────── */}
      {activeTab === "notifications" && (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-base mb-5" style={{ color: "#004F9F" }}>Notification Preferences</h2>
          <div className="flex flex-col gap-5">
            {(
              [
                { key: "scholarshipDeadlines", label: "Scholarship Deadlines",   sub: "Get alerted when a saved scholarship is closing soon." },
                { key: "internshipMatches",    label: "New Internship Matches",   sub: "Be notified when new internships match your profile." },
                { key: "aiInsights",           label: "AI Coach Insights",        sub: "Receive weekly tips from your AI coach." },
                { key: "weeklyDigest",         label: "Weekly Summary Digest",    sub: "A Sunday recap of your finances, career, and academics." },
              ] as { key: keyof typeof NOTIFICATION_DEFAULTS; label: string; sub: string }[]
            ).map(({ key, label, sub }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
                <button
                  onClick={() => toggleNotif(key)}
                  className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                  style={{ backgroundColor: notifications[key] ? "#004F9F" : "#d1d5db" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{ transform: notifications[key] ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Account ─────────────────────────────────────────────────────────── */}
      {activeTab === "account" && (
        <div className="flex flex-col gap-4">
          {/* Appearance */}
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-base mb-4" style={{ color: "#004F9F" }}>Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Dark Mode</p>
                <p className="text-xs text-gray-400 mt-0.5">Switch between light and dark theme.</p>
              </div>
              <button
                onClick={toggle}
                className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                style={{ backgroundColor: theme === "dark" ? "#004F9F" : "#d1d5db" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{ transform: theme === "dark" ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-base mb-1" style={{ color: "#004F9F" }}>About ScholarSync</h2>
            <p className="text-sm text-gray-500 mb-4">Built for the Bank of America Financial Wellness Hackathon · NC A&T State University · 2026</p>
            <div className="flex gap-3 text-xs text-gray-400">
              <span>Version 1.0.0</span>
              <span>·</span>
              <span>Next.js + FastAPI</span>
            </div>
          </div>

          <div className="bg-white border border-red-100 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-base mb-1 text-red-600">Danger Zone</h2>
            <p className="text-sm text-gray-500 mb-4">This will clear all your saved data and return you to the landing page.</p>
            <button
              onClick={handleDeleteAccount}
              className="text-sm font-semibold px-4 py-2.5 rounded-lg border transition-colors hover:bg-red-50"
              style={{ color: "#dc2626", borderColor: "#dc2626" }}
            >
              Clear Data & Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
