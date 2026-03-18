"use client";

import { useState } from "react";
import Link from "next/link";

const opportunities = [
  {
    title: "Google Generation Scholarship",
    type: "Scholarship",
    amount: "$10,000",
    deadline: "April 5, 2026",
    description: "For students from underrepresented groups studying CS or related fields.",
    tags: ["CS", "Underrepresented"],
    urgent: true,
  },
  {
    title: "Bank of America Student Leaders Program",
    type: "Fellowship",
    amount: "$5,000 + paid internship",
    deadline: "April 20, 2026",
    description: "Leadership program connecting students with nonprofits and financial education.",
    tags: ["Leadership", "Finance"],
    urgent: false,
  },
  {
    title: "NSBE Scholarship",
    type: "Scholarship",
    amount: "$3,000",
    deadline: "May 1, 2026",
    description: "National Society of Black Engineers scholarship for engineering students.",
    tags: ["Engineering", "NSBE"],
    urgent: false,
  },
  {
    title: "HackNC Hackathon",
    type: "Hackathon",
    amount: "$2,500 prize",
    deadline: "April 12, 2026",
    description: "48-hour hackathon open to all college students in the Southeast.",
    tags: ["Hackathon", "Team"],
    urgent: true,
  },
  {
    title: "AWS Educate Cloud Scholarship",
    type: "Scholarship",
    amount: "$4,000",
    deadline: "May 15, 2026",
    description: "For students pursuing cloud computing or DevOps career paths.",
    tags: ["Cloud", "AWS"],
    urgent: false,
  },
  {
    title: "Congressional Black Caucus STEM Fellowship",
    type: "Fellowship",
    amount: "$8,000",
    deadline: "April 28, 2026",
    description: "STEM fellowship for Black students with a passion for public service.",
    tags: ["STEM", "Fellowship"],
    urgent: false,
  },
];

const types = ["All", "Scholarship", "Fellowship", "Hackathon"];

const typeColors: Record<string, string> = {
  Scholarship: "#012169",
  Fellowship: "#7c3aed",
  Hackathon: "#059669",
};

export default function Opportunities() {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All" ? opportunities : opportunities.filter((o) => o.type === filter);

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ color: "#012169" }}>
        Opportunities
      </h1>
      <p className="text-gray-500 mb-6">
        Scholarships, fellowships, and hackathons matched to your profile.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={
              filter === type
                ? { backgroundColor: "#E31837", color: "#fff", borderColor: "#E31837" }
                : { backgroundColor: "#fff", color: "#012169", borderColor: "#012169" }
            }
          >
            {type}
          </button>
        ))}
      </div>

      {/* Opportunity Cards */}
      <div className="flex flex-col gap-4">
        {filtered.map((opp) => (
          <div
            key={opp.title}
            className="border border-gray-200 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: typeColors[opp.type] ?? "#012169" }}
                  >
                    {opp.type}
                  </span>
                  {opp.urgent && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#E31837" }}>
                      Deadline Soon
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{opp.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{opp.description}</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-xl font-bold" style={{ color: "#E31837" }}>
                  {opp.amount}
                </p>
                <p className="text-xs text-gray-400 mt-1">Due: {opp.deadline}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mt-3">
              {opp.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full border"
                  style={{ borderColor: "#012169", color: "#012169" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
