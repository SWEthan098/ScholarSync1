"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Profile {
  name: string;
  major: string;
  year: string;
  careerInterest: string;
}

const cards = [
  {
    title: "Finance",
    description: "Tuition balance, spending habits, and debt timeline.",
    href: "/finance",
    stat: "$8,000 secured",
    statLabel: "in scholarships",
  },
  {
    title: "Career",
    description: "Internship listings with real salary data from levels.fyi.",
    href: "/career",
    stat: "12 opportunities",
    statLabel: "matched to you",
  },
  {
    title: "Academics",
    description: "Your schedule, transcript, and course drop advisor.",
    href: "/academics",
    stat: "3.4 GPA",
    statLabel: "current standing",
  },
  {
    title: "Opportunities",
    description: "Top scholarships, fellowships, and hackathons for you.",
    href: "/opportunities",
    stat: "5 deadlines",
    statLabel: "coming up soon",
  },
];

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("scholar_profile");
    if (stored) setProfile(JSON.parse(stored));
  }, []);

  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold" style={{ color: "#012169" }}>
          Welcome back{profile?.name ? `, ${profile.name}` : ""}
        </h1>
        <p className="text-gray-500 mt-1">
          {profile
            ? `${profile.year} · ${profile.major} · ${profile.careerInterest}`
            : "Loading your profile..."}
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="block border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold mb-1" style={{ color: "#012169" }}>
              {card.title}
            </h2>
            <p className="text-gray-500 text-sm mb-4">{card.description}</p>
            <div>
              <span className="text-2xl font-bold" style={{ color: "#E31837" }}>
                {card.stat}
              </span>
              <span className="text-gray-400 text-sm ml-2">{card.statLabel}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Voice coach banner */}
      <Link
        href="/voice"
        className="flex items-center justify-between w-full rounded-2xl px-8 py-6 text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: "#E31837" }}
      >
        <div>
          <h2 className="text-xl font-bold">Talk to your AI Coach</h2>
          <p className="text-red-100 text-sm mt-1">
            Ask anything about your career, finances, or next steps.
          </p>
        </div>
        <span className="text-sm font-semibold uppercase tracking-widest opacity-75">Launch</span>
      </Link>
    </main>
  );
}
