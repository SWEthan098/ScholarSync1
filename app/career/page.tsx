"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_OPTIONS = ["Wishlist", "Applied", "Interviewing", "Rejected"] as const;
type Status = typeof STATUS_OPTIONS[number];

const statusColors: Record<Status, { bg: string; text: string }> = {
  Wishlist:    { bg: "#f3f4f6", text: "#6b7280" },
  Applied:     { bg: "#dbeafe", text: "#1d4ed8" },
  Interviewing:{ bg: "#d1fae5", text: "#065f46" },
  Rejected:    { bg: "#fee2e2", text: "#991b1b" },
};

interface Internship {
  company: string;
  role: string;
  location: string;
  pay: string;
  payNum: number;
  base: number;
  tc: number;
  deadline: string;
  deadlineDays: number;
  tags: string[];
  link: string;
}

const MOCK_INTERNSHIPS: Internship[] = [
  { company: "Google", role: "Software Engineer Intern", location: "Mountain View, CA", pay: "$55/hr", payNum: 55, base: 114000, tc: 140000, deadline: "April 15, 2026", deadlineDays: 29, tags: ["SWE", "Full-time conversion"], link: "https://careers.google.com" },
  { company: "Microsoft", role: "Software Engineer Intern", location: "Redmond, WA", pay: "$52/hr", payNum: 52, base: 108000, tc: 130000, deadline: "April 30, 2026", deadlineDays: 44, tags: ["SWE", "Azure", "Full-time conversion"], link: "https://careers.microsoft.com" },
  { company: "CrowdStrike", role: "Cybersecurity Engineer Intern", location: "Remote", pay: "$45/hr", payNum: 45, base: 93000, tc: 110000, deadline: "May 1, 2026", deadlineDays: 45, tags: ["Cybersecurity", "Remote"], link: "https://crowdstrike.com/careers" },
  { company: "Amazon", role: "Cloud Support Engineer Intern", location: "Seattle, WA", pay: "$50/hr", payNum: 50, base: 104000, tc: 125000, deadline: "April 20, 2026", deadlineDays: 34, tags: ["Cloud", "AWS"], link: "https://amazon.jobs" },
  { company: "Meta", role: "Data Engineer Intern", location: "Menlo Park, CA", pay: "$58/hr", payNum: 58, base: 120000, tc: 150000, deadline: "April 10, 2026", deadlineDays: 24, tags: ["Data", "Full-time conversion"], link: "https://metacareers.com" },
];

const roadmap = [
  { semester: "Freshman Year", year: 1, tasks: ["Learn a programming language", "Join a tech club", "Build a small project"] },
  { semester: "Sophomore Year", year: 2, tasks: ["Earn a certification", "Apply for summer internships", "Start LeetCode practice"] },
  { semester: "Junior Year", year: 3, tasks: ["Complete a tech internship", "Contribute to open source", "Attend career fairs"] },
  { semester: "Senior Year", year: 4, tasks: ["Apply for full-time roles", "Polish resume + portfolio", "Prepare for interviews"] },
];

const yearIndex: Record<string, number> = { Freshman: 1, Sophomore: 2, Junior: 3, Senior: 4 };

function DeadlineBadge({ days }: { days: number }) {
  if (days <= 7)  return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">Closing in {days}d</span>;
  if (days <= 21) return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">{days}d left</span>;
  return <span className="text-xs text-gray-400">{days}d left</span>;
}

export default function Career() {
  const [internships, setInternships] = useState<Internship[]>(MOCK_INTERNSHIPS);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [appliedDates, setAppliedDates] = useState<Record<string, string>>({});
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<"default" | "deadline" | "pay">("default");
  const [userYear, setUserYear] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem("scholar_profile");
    if (stored) {
      const p = JSON.parse(stored);
      setUserYear(yearIndex[p.year] ?? 1);

      const API = process.env.NEXT_PUBLIC_API_URL;
      if (!API) return;
      const role = encodeURIComponent(p.careerInterest ?? "Software Engineer");
      fetch(`${API}/salaries?role=${role}`)
        .then((r) => r.json())
        .then((data) => {
          // backend returns a list or single object — normalize to array
          const results: any[] = Array.isArray(data) ? data : data?.results ?? (data?.role ? [data] : []);
          if (results.length === 0) return;
          const mapped = results.slice(0, 5).map((s: any) => ({
            company: s.company ?? s.employer ?? "Company",
            role: s.role ?? s.title ?? p.careerInterest ?? "Role",
            location: s.location ?? "Remote",
            pay: s.hourly ? `$${s.hourly}/hr` : s.pay ?? "$50/hr",
            payNum: s.hourly ?? s.payNum ?? 50,
            base: s.base ?? s.base_salary ?? 100000,
            tc: s.tc ?? s.total_compensation ?? s.base ?? 100000,
            deadline: s.deadline ?? "Open",
            deadlineDays: s.deadlineDays ?? 30,
            tags: Array.isArray(s.tags) ? s.tags : [],
            link: s.link ?? s.url ?? "#",
          }));
          setInternships(mapped);
        })
        .catch(() => {});
    }
  }, []);

  const sorted = [...internships].sort((a, b) => {
    if (sortBy === "deadline") return a.deadlineDays - b.deadlineDays;
    if (sortBy === "pay") return b.payNum - a.payNum;
    return 0;
  });

  const setStatus = (key: string, val: Status) => setStatuses((p) => ({ ...p, [key]: val }));
  const setNote = (key: string, val: string) => setNotes((p) => ({ ...p, [key]: val }));
  const setDate = (key: string, val: string) => setAppliedDates((p) => ({ ...p, [key]: val }));
  const toggleTask = (key: string) => setCheckedTasks((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <span style={{ color: "#004F9F" }}>Career</span>
      </nav>

      <h1 className="text-2xl font-bold mb-1" style={{ color: "#004F9F" }}>Career Explorer</h1>
      <p className="text-gray-500 text-sm mb-6">Track applications and plan your career path. Salary data from levels.fyi.</p>

      <div className="flex gap-6 items-start">

        {/* Main — internships */}
        <div className="flex-1 min-w-0">
          {/* Sort controls */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>Matched Internships</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sort by:</span>
              {(["default", "deadline", "pay"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className="text-xs px-3 py-1 rounded-lg border font-medium transition-colors capitalize"
                  style={
                    sortBy === opt
                      ? { backgroundColor: "#004F9F", color: "#fff", borderColor: "#004F9F" }
                      : { color: "#6b7280", borderColor: "#e5e7eb" }
                  }
                >
                  {opt === "default" ? "Matched" : opt === "deadline" ? "Deadline" : "Pay"}
                </button>
              ))}
            </div>
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">No internships matched yet.</p>
              <Link href="/onboarding" className="text-sm font-semibold" style={{ color: "#004F9F" }}>
                Update your profile to see matches
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {sorted.map((job) => {
              const key = `${job.company}-${job.role}`;
              const status: Status = statuses[key] ?? "Wishlist";
              const sc = statusColors[status];
              return (
                <div key={key} className="bg-white border border-gray-100 rounded-lg shadow-sm p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-gray-800">{job.company}</h3>
                        <DeadlineBadge days={job.deadlineDays} />
                      </div>
                      <p className="text-sm text-gray-600">{job.role}</p>
                      <p className="text-xs text-gray-400">{job.location}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-lg font-bold" style={{ color: "#FFB81C" }}>{job.pay}</p>
                      <p className="text-xs text-gray-400">Base: ${job.base.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">TC: ${job.tc.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Tags + external link */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-2 flex-wrap">
                      {job.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-lg border" style={{ borderColor: "#004F9F", color: "#004F9F" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                      style={{ color: "#004F9F" }}
                    >
                      Apply
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  </div>

                  {/* Status + applied date */}
                  <div className="flex items-center gap-3 mb-3">
                    <select
                      value={status}
                      onChange={(e) => setStatus(key, e.target.value as Status)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer"
                      style={{ backgroundColor: sc.bg, color: sc.text }}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    {status === "Applied" && (
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-gray-400">Applied:</label>
                        <input
                          type="date"
                          value={appliedDates[key] ?? ""}
                          onChange={(e) => setDate(key, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-0.5 focus:outline-none"
                        />
                      </div>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">Deadline: {job.deadline}</span>
                  </div>

                  {/* Notes */}
                  <textarea
                    placeholder="Add a note (referral contact, portfolio updates, etc.)"
                    value={notes[key] ?? ""}
                    onChange={(e) => setNote(key, e.target.value)}
                    rows={2}
                    className="w-full text-xs border border-gray-100 rounded-lg px-3 py-2 text-gray-700 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-200 resize-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky sidebar — Career Roadmap */}
        <div className="w-64 shrink-0 sticky top-6">
          <h2 className="font-semibold text-base mb-3" style={{ color: "#004F9F" }}>Career Roadmap</h2>
          <div className="flex flex-col gap-3">
            {roadmap.map((step) => {
              const isPast = step.year < userYear;
              const isCurrent = step.year === userYear;
              return (
                <div
                  key={step.semester}
                  className={`border rounded-lg p-4 ${isPast ? "opacity-50" : ""}`}
                  style={{ borderColor: isCurrent ? "#004F9F" : "#e5e7eb" }}
                >
                  <h3
                    className="text-xs font-bold mb-2 uppercase tracking-wide"
                    style={{ color: isCurrent ? "#004F9F" : "#FFB81C" }}
                  >
                    {step.semester} {isCurrent && "← Now"}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {step.tasks.map((task) => {
                      const taskKey = `${step.semester}-${task}`;
                      const done = isPast || checkedTasks[taskKey];
                      return (
                        <li key={task} className="flex items-start gap-2">
                          <button
                            onClick={() => !isPast && toggleTask(taskKey)}
                            className="w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center"
                            style={done ? { backgroundColor: "#004F9F", borderColor: "#004F9F" } : { borderColor: "#d1d5db" }}
                          >
                            {done && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                          <span className={`text-xs leading-snug ${done ? "line-through text-gray-400" : "text-gray-600"}`}>
                            {task}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
