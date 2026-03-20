"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Submitted", "Won"] as const;
type Status = typeof STATUS_OPTIONS[number];

const statusColors: Record<Status, { bg: string; color: string }> = {
  "Not Started": { bg: "#f3f4f6", color: "#6b7280" },
  "In Progress": { bg: "#dbeafe", color: "#1d4ed8" },
  "Submitted":   { bg: "#d1fae5", color: "#065f46" },
  "Won":         { bg: "#fef9c3", color: "#854d0e" },
};

interface Opportunity {
  id: string;
  title: string;
  type: "Scholarship" | "Fellowship" | "Hackathon" | "Internship";
  amount: string;
  amountNum: number;
  deadline: string;
  deadlineDays: number;
  deadlineDay: number | null; // day-of-month in April 2026, null if not April
  description: string;
  tags: string[];
  link: string;
  matchScore: number;
  matchReason: string;
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "google-gen",
    title: "Google Generation Scholarship",
    type: "Scholarship",
    amount: "$10,000",
    amountNum: 10000,
    deadline: "April 5, 2026",
    deadlineDays: 19,
    deadlineDay: 5,
    description: "For students from underrepresented groups studying CS or related fields.",
    tags: ["CS", "Underrepresented"],
    link: "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship",
    matchScore: 95,
    matchReason: "CS major + underrepresented student at HBCU",
  },
  {
    id: "boa-leaders",
    title: "Bank of America Student Leaders Program",
    type: "Fellowship",
    amount: "$5,000 + internship",
    amountNum: 5000,
    deadline: "April 20, 2026",
    deadlineDays: 34,
    deadlineDay: 20,
    description: "Leadership program connecting students with nonprofits and financial education.",
    tags: ["Leadership", "Finance"],
    link: "https://about.bankofamerica.com/en/making-an-impact/student-leaders",
    matchScore: 88,
    matchReason: "Financial wellness interest + leadership profile",
  },
  {
    id: "nsbe",
    title: "NSBE Scholarship",
    type: "Scholarship",
    amount: "$3,000",
    amountNum: 3000,
    deadline: "May 1, 2026",
    deadlineDays: 45,
    deadlineDay: null,
    description: "National Society of Black Engineers scholarship for engineering students.",
    tags: ["Engineering", "NSBE", "HBCU"],
    link: "https://www.nsbe.org/programs/scholarship/",
    matchScore: 92,
    matchReason: "Black engineering student at HBCU",
  },
  {
    id: "hacknc",
    title: "HackNC Hackathon",
    type: "Hackathon",
    amount: "$2,500",
    amountNum: 2500,
    deadline: "April 12, 2026",
    deadlineDays: 26,
    deadlineDay: 12,
    description: "48-hour hackathon open to all college students in the Southeast.",
    tags: ["Hackathon", "Team", "Southeast"],
    link: "https://hacknc.com",
    matchScore: 85,
    matchReason: "Software Engineer interest + Southeast region",
  },
  {
    id: "aws",
    title: "AWS Educate Cloud Scholarship",
    type: "Scholarship",
    amount: "$4,000",
    amountNum: 4000,
    deadline: "May 15, 2026",
    deadlineDays: 59,
    deadlineDay: null,
    description: "For students pursuing cloud computing or DevOps career paths.",
    tags: ["Cloud", "AWS", "DevOps"],
    link: "https://aws.amazon.com/education/awseducate/",
    matchScore: 78,
    matchReason: "Technology major, cloud computing adjacent",
  },
  {
    id: "cbc-stem",
    title: "Congressional Black Caucus STEM Fellowship",
    type: "Fellowship",
    amount: "$8,000",
    amountNum: 8000,
    deadline: "April 28, 2026",
    deadlineDays: 42,
    deadlineDay: 28,
    description: "STEM fellowship for Black students with a passion for public service.",
    tags: ["STEM", "Fellowship", "Public Service"],
    link: "https://cbcfinc.org/programs/",
    matchScore: 90,
    matchReason: "Black STEM student + public service alignment",
  },
  {
    id: "uncf-general",
    title: "UNCF General Scholarship",
    type: "Scholarship",
    amount: "$5,000",
    amountNum: 5000,
    deadline: "May 10, 2026",
    deadlineDays: 51,
    deadlineDay: 10,
    description: "United Negro College Fund scholarship open to all HBCU undergraduates with demonstrated financial need.",
    tags: ["HBCU", "UNCF", "Financial Need"],
    link: "https://uncf.org/scholarships",
    matchScore: 94,
    matchReason: "HBCU student + underrepresented",
  },
  {
    id: "mlh-global",
    title: "MLH Global Hackathon",
    type: "Hackathon",
    amount: "$3,000",
    amountNum: 3000,
    deadline: "April 18, 2026",
    deadlineDays: 29,
    deadlineDay: 18,
    description: "Major League Hacking's flagship virtual hackathon — build anything in 36 hours.",
    tags: ["Hackathon", "Remote", "Open Source"],
    link: "https://mlh.io",
    matchScore: 83,
    matchReason: "Software Engineer interest + hackathon experience",
  },
  {
    id: "microsoft-leap",
    title: "Microsoft LEAP Apprenticeship",
    type: "Internship",
    amount: "$25/hr",
    amountNum: 5000,
    deadline: "April 30, 2026",
    deadlineDays: 41,
    deadlineDay: 30,
    description: "16-week paid apprenticeship for software engineers from non-traditional backgrounds.",
    tags: ["Microsoft", "Internship", "Software Engineering"],
    link: "https://leap.microsoft.com",
    matchScore: 87,
    matchReason: "Software Engineer career interest",
  },
  {
    id: "adobe-diversity",
    title: "Adobe Research Women-in-Technology Scholarship",
    type: "Scholarship",
    amount: "$10,000",
    amountNum: 10000,
    deadline: "June 1, 2026",
    deadlineDays: 73,
    deadlineDay: 1,
    description: "Recognizes outstanding female undergraduate students in CS, engineering, and math.",
    tags: ["CS", "Women in Tech", "Research"],
    link: "https://research.adobe.com/scholarship/",
    matchScore: 80,
    matchReason: "CS major + underrepresented group",
  },
  {
    id: "gates-millennium",
    title: "Gates Millennium Scholars Program",
    type: "Fellowship",
    amount: "$20,000",
    amountNum: 20000,
    deadline: "May 20, 2026",
    deadlineDays: 61,
    deadlineDay: 20,
    description: "Full scholarship for outstanding minority students with significant financial need.",
    tags: ["Fellowship", "Minority", "Financial Need", "Full Scholarship"],
    link: "https://gmsp.org",
    matchScore: 93,
    matchReason: "Underrepresented HBCU student",
  },
  {
    id: "meta-university",
    title: "Meta University Internship",
    type: "Internship",
    amount: "$30/hr",
    amountNum: 6000,
    deadline: "April 8, 2026",
    deadlineDays: 19,
    deadlineDay: 8,
    description: "Immersive 8-week internship program at Meta for sophomore-level CS students.",
    tags: ["Meta", "Internship", "CS", "Software Engineering"],
    link: "https://metacareers.com",
    matchScore: 89,
    matchReason: "CS major + Software Engineer interest",
  },
  {
    id: "afcea-stem",
    title: "AFCEA STEM Teacher Scholarship",
    type: "Scholarship",
    amount: "$2,500",
    amountNum: 2500,
    deadline: "May 5, 2026",
    deadlineDays: 46,
    deadlineDay: 5,
    description: "For students pursuing STEM education degrees with an interest in teaching.",
    tags: ["STEM", "Education", "AFCEA"],
    link: "https://afcea.org/scholarships",
    matchScore: 60,
    matchReason: "STEM student",
  },
  {
    id: "cra-urp",
    title: "CRA Undergraduate Research Program",
    type: "Fellowship",
    amount: "$6,000",
    amountNum: 6000,
    deadline: "June 15, 2026",
    deadlineDays: 87,
    deadlineDay: 15,
    description: "Computing Research Association grant for undergraduates conducting CS research with faculty.",
    tags: ["Research", "CS", "Fellowship"],
    link: "https://cra.org/cra-wp/urp/",
    matchScore: 82,
    matchReason: "CS major + research track",
  },
  {
    id: "github-education",
    title: "GitHub Education Hackathon",
    type: "Hackathon",
    amount: "$1,500",
    amountNum: 1500,
    deadline: "April 25, 2026",
    deadlineDays: 36,
    deadlineDay: 25,
    description: "GitHub-sponsored hackathon for students building tools that improve developer workflows.",
    tags: ["GitHub", "Open Source", "Developer Tools"],
    link: "https://education.github.com",
    matchScore: 81,
    matchReason: "Software Engineer interest + open source",
  },
  {
    id: "ibm-hbcu",
    title: "IBM HBCU Scholars Program",
    type: "Fellowship",
    amount: "$15,000",
    amountNum: 15000,
    deadline: "May 25, 2026",
    deadlineDays: 66,
    deadlineDay: 25,
    description: "IBM scholarship and mentoring program exclusively for students enrolled at HBCUs.",
    tags: ["HBCU", "IBM", "Technology", "Mentorship"],
    link: "https://www.ibm.com/impact/initiatives/ibm-hbcu-scholars",
    matchScore: 96,
    matchReason: "HBCU student + technology major",
  },
  {
    id: "ncar-stem",
    title: "NC A&T STEM Research Grant",
    type: "Scholarship",
    amount: "$3,500",
    amountNum: 3500,
    deadline: "April 14, 2026",
    deadlineDays: 25,
    deadlineDay: 14,
    description: "Internal research grant for A&T undergraduates pursuing STEM projects with faculty.",
    tags: ["NC A&T", "Research", "STEM", "Internal"],
    link: "#",
    matchScore: 97,
    matchReason: "NC A&T student + STEM major",
  },
  {
    id: "jp-morgan-hbcu",
    title: "JPMorgan Chase HBCU Fellowship",
    type: "Internship",
    amount: "$28/hr",
    amountNum: 5600,
    deadline: "June 30, 2026",
    deadlineDays: 102,
    deadlineDay: 30,
    description: "10-week summer internship at JPMorgan for HBCU students in finance, technology, or data science.",
    tags: ["HBCU", "Finance", "JPMorgan", "Internship"],
    link: "https://careers.jpmorgan.com",
    matchScore: 88,
    matchReason: "HBCU student + financial technology interest",
  },
];

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function daysUntil(deadline: string): number {
  if (!deadline || deadline === "TBD") return 999;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return 999;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function computeMatchScore(opp: Opportunity, profile: Record<string, string>): { score: number; reason: string } {
  const major = (profile.major ?? "").toLowerCase();
  const career = (profile.careerInterest ?? "").toLowerCase();
  const allText = [opp.title, opp.description, ...opp.tags].join(" ").toLowerCase();

  let score = 50;
  const reasons: string[] = [];

  // HBCU boost — they're at NC A&T
  if (allText.includes("hbcu") || allText.includes("historically black")) {
    score += 20; reasons.push("HBCU student");
  }
  // Underrepresented / Black student boost
  if (allText.includes("black") || allText.includes("underrepresented") || allText.includes("minority") || allText.includes("diverse")) {
    score += 15; reasons.push("underrepresented student");
  }
  // Major match
  if ((major.includes("computer") || major.includes("cs") || major.includes("software")) &&
      (allText.includes("cs") || allText.includes("computer") || allText.includes("software") || allText.includes("technology") || allText.includes("engineering"))) {
    score += 15; reasons.push(`${profile.major} major`);
  }
  // Career interest match
  if (career.includes("software") && (allText.includes("software") || allText.includes("engineer") || allText.includes("hackathon"))) {
    score += 10; reasons.push("Software Engineer interest");
  }
  if (career.includes("cybersecurity") && (allText.includes("security") || allText.includes("cyber"))) {
    score += 10; reasons.push("Cybersecurity interest");
  }
  if (career.includes("cloud") && (allText.includes("cloud") || allText.includes("aws") || allText.includes("devops"))) {
    score += 10; reasons.push("Cloud Engineer interest");
  }
  if (career.includes("data") && (allText.includes("data") || allText.includes("analytics") || allText.includes("ml"))) {
    score += 10; reasons.push("Data Scientist interest");
  }
  if (career.includes("ai") || career.includes("ml")) {
    if (allText.includes("ai") || allText.includes("machine learning") || allText.includes("data")) {
      score += 10; reasons.push("AI/ML interest");
    }
  }
  // STEM broad match
  if (allText.includes("stem") && (major.includes("computer") || major.includes("math") || major.includes("engineer"))) {
    score += 8; reasons.push("STEM major");
  }

  const reason = reasons.length > 0
    ? reasons.join(" + ")
    : (profile.major ? `${profile.major} major` : "Matched to your profile");

  return { score: Math.min(score, 99), reason };
}

const typeColors: Record<string, string> = {
  Scholarship: "#004F9F",
  Fellowship:  "#7c3aed",
  Hackathon:   "#059669",
  Internship:  "#d97706",
};

const types        = ["All", "Scholarship", "Fellowship", "Internship", "Hackathon", "Saved"];
const sortOptions  = ["Best Match", "Deadline (Soonest)", "Amount (Highest)"];
const amountFilters = ["Any Amount", "$2,500+", "$5,000+", "$8,000+"];
const minAmountMap: Record<string, number> = {
  "Any Amount": 0, "$2,500+": 2500, "$5,000+": 5000, "$8,000+": 8000,
};

function DeadlineBadge({ days }: { days: number }) {
  if (days <= 5)  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Closes in {days}d</span>;
  if (days <= 14) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{days} days left</span>;
  if (days <= 30) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{days} days left</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{days}d left</span>;
}

export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [filter, setFilter]           = useState("All");
  const [search, setSearch]           = useState("");
  const [sortBy, setSortBy]           = useState("Best Match");
  const [amountFilter, setAmountFilter] = useState("Any Amount");
  const [statuses, setStatuses]       = useState<Record<string, Status>>({});
  const [saved, setSaved]             = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed]     = useState<Record<string, boolean>>({});

  // Load saved opportunities data from localStorage
  useEffect(() => {
    const k = user?.id ?? "demo";
    const s = localStorage.getItem(`opps_saved_${k}`);
    const d = localStorage.getItem(`opps_dismissed_${k}`);
    const st = localStorage.getItem(`opps_statuses_${k}`);
    const custom = localStorage.getItem(`opps_custom_${k}`);
    if (s) setSaved(JSON.parse(s));
    if (d) setDismissed(JSON.parse(d));
    if (st) setStatuses(JSON.parse(st));
    if (custom) setOpportunities([...JSON.parse(custom), ...MOCK_OPPORTUNITIES]);
    const p = localStorage.getItem("scholar_profile");
    if (p) setProfile(JSON.parse(p));
  }, [user?.id]);
  const [calendarView, setCalendarView] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [openInsight, setOpenInsight] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailOpp, setDetailOpp] = useState<Opportunity | null>(null);
  const [addForm, setAddForm] = useState({ title: "", type: "Scholarship", amount: "", deadline: "", description: "", link: "", tags: "" });

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const enriched = useMemo(() => opportunities.map((o) => {
    const liveDays = daysUntil(o.deadline);
    const { score, reason } = computeMatchScore(o, profile);
    return { ...o, deadlineDays: liveDays, matchScore: o.id.startsWith("custom-") ? o.matchScore : score, matchReason: o.id.startsWith("custom-") ? o.matchReason : reason };
  }), [opportunities, profile]);

  const deadlineDayMap = useMemo(() => {
    setSelectedDay(null);
    const map: Record<number, Opportunity> = {};
    enriched.forEach((o) => {
      if (!o.deadline || o.deadline === "TBD") return;
      const d = new Date(o.deadline);
      if (isNaN(d.getTime())) return;
      if (d.getFullYear() === calendarDate.year && d.getMonth() === calendarDate.month) {
        map[d.getDate()] = o;
      }
    });
    return map;
  }, [enriched, calendarDate]);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    if (!API) return;
    fetch(`${API}/opportunities/`)
      .then((r) => r.json())
      .then((data) => {
        const raw: unknown[] = Array.isArray(data) ? data : data?.opportunities ?? [];
        if (raw.length === 0) return;
        const mapped: Opportunity[] = raw.map((o: any) => ({
          id: o.id ?? o._id ?? String(Math.random()),
          title: o.title ?? o.name ?? "Unknown",
          type: (() => { const combined = `${o.type ?? ""} ${o.title ?? ""}`.toLowerCase(); if (combined.includes("internship") || combined.includes("intern")) return "Internship"; if (combined.includes("fellowship")) return "Fellowship"; if (combined.includes("hackathon")) return "Hackathon"; return "Scholarship"; })(),
          amount: typeof o.amount === "number" ? `$${o.amount.toLocaleString()}` : (o.amount ?? "$0"),
          amountNum: typeof o.amount === "number" ? o.amount : parseInt(String(o.amount ?? "0").replace(/\D/g, "")) || 0,
          deadline: o.deadline ?? "TBD",
          deadlineDays: o.deadlineDays ?? o.days_until_deadline ?? 30,
          deadlineDay: o.deadlineDay ?? null,
          description: o.description ?? "",
          tags: Array.isArray(o.tags) ? o.tags : [],
          link: o.link ?? o.url ?? "#",
          matchScore: o.matchScore ?? o.match_score ?? 80,
          matchReason: o.matchReason ?? o.match_reason ?? "Matched to your profile",
        }));
        // Merge API results with mocks; API results take precedence for same IDs
        const apiIds = new Set(mapped.map((o) => o.id));
        const uniqueMocks = MOCK_OPPORTUNITIES.filter((o) => !apiIds.has(o.id));
        setOpportunities([...mapped, ...uniqueMocks]);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return enriched
      .filter((o) => !dismissed[o.id])
      .filter((o) => o.deadlineDays > 0) // hide already-passed deadlines
      .filter((o) => filter === "All" || (filter === "Saved" ? saved[o.id] : o.type === filter))
      .filter((o) => o.amountNum >= minAmountMap[amountFilter])
      .filter((o) =>
        search === "" ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        o.description.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "Deadline (Soonest)") return a.deadlineDays - b.deadlineDays;
        if (sortBy === "Amount (Highest)")   return b.amountNum - a.amountNum;
        return b.matchScore - a.matchScore;
      });
  }, [enriched, filter, search, sortBy, amountFilter, dismissed, saved]);

  const k = user?.id ?? "demo";
  const setStatus  = (id: string, val: Status) => setStatuses((p) => {
    const next = { ...p, [id]: val };
    localStorage.setItem(`opps_statuses_${k}`, JSON.stringify(next));
    return next;
  });
  const toggleSave = (id: string) => setSaved((p) => {
    const next = { ...p, [id]: !p[id] };
    localStorage.setItem(`opps_saved_${k}`, JSON.stringify(next));
    return next;
  });
  const dismiss    = (id: string) => setDismissed((p) => {
    const next = { ...p, [id]: true };
    localStorage.setItem(`opps_dismissed_${k}`, JSON.stringify(next));
    return next;
  });

  const handleAddOpportunity = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newOpp: Opportunity = {
      id: `custom-${Date.now()}`,
      title: addForm.title,
      type: addForm.type as Opportunity["type"],
      amount: addForm.amount ? `$${addForm.amount}` : "N/A",
      amountNum: parseInt(addForm.amount) || 0,
      deadline: addForm.deadline || "TBD",
      deadlineDays: addForm.deadline ? Math.ceil((new Date(addForm.deadline).getTime() - Date.now()) / 86400000) : 30,
      deadlineDay: null,
      description: addForm.description,
      tags: addForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      link: addForm.link || "#",
      matchScore: 0,
      matchReason: "Added manually",
    };
    setOpportunities((prev) => {
      const next = [newOpp, ...prev];
      const customOnly = next.filter((o) => o.id.startsWith("custom-"));
      localStorage.setItem(`opps_custom_${k}`, JSON.stringify(customOnly));
      return next;
    });
    setAddForm({ title: "", type: "Scholarship", amount: "", deadline: "", description: "", link: "", tags: "" });
    setShowAddModal(false);
  };

  const handleExportCSV = () => {
    const rows = [
      ["Title", "Type", "Amount", "Deadline", "Status", "Saved"],
      ...filtered.map((o) => [
        o.title, o.type, o.amount, o.deadline,
        statuses[o.id] ?? "Not Started",
        saved[o.id] ? "Yes" : "No",
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = "scholarsync-opportunities.csv";
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Add Opportunity Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "#004F9F" }}>Add Opportunity</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleAddOpportunity} className="flex flex-col gap-3">
              <input required placeholder="Title" value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <select value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none">
                {["Scholarship","Fellowship","Internship","Hackathon"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <input placeholder="Amount (numbers only, e.g. 5000)" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <input type="date" value={addForm.deadline} onChange={(e) => setAddForm({ ...addForm, deadline: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <textarea placeholder="Description" value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none" />
              <input placeholder="Application link (optional)" value={addForm.link} onChange={(e) => setAddForm({ ...addForm, link: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <input placeholder="Tags (comma separated, e.g. CS, HBCU)" value={addForm.tags} onChange={(e) => setAddForm({ ...addForm, tags: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <div className="flex gap-3 mt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: "#004F9F" }}>Add</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold border hover:bg-gray-50" style={{ color: "#004F9F", borderColor: "#004F9F" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Detail Modal */}
      {detailOpp && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailOpp(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: typeColors[detailOpp.type] ?? "#004F9F" }}>{detailOpp.type}</span>
                  <DeadlineBadge days={detailOpp.deadlineDays} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">{detailOpp.title}</h2>
              </div>
              <button onClick={() => setDetailOpp(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold shrink-0">×</button>
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-2xl font-bold" style={{ color: "#FFB81C" }}>{detailOpp.amount}</p>
              <p className="text-sm text-gray-500">Due: {detailOpp.deadline}</p>
            </div>
            <p className="text-sm text-gray-700 mb-4">{detailOpp.description}</p>
            {detailOpp.matchReason && detailOpp.matchReason !== "Added manually" && (
              <div className="px-3 py-2 rounded-lg text-xs text-gray-700 mb-4" style={{ backgroundColor: "#f0f7ff" }}>
                <strong style={{ color: "#004F9F" }}>Why this matches you: </strong>{detailOpp.matchReason}
              </div>
            )}
            {detailOpp.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {detailOpp.tags.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded-lg border" style={{ borderColor: "#004F9F", color: "#004F9F" }}>{t}</span>)}
              </div>
            )}
            <div className="flex gap-3">
              {detailOpp.link && detailOpp.link !== "#" && (
                <a href={detailOpp.link} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: "#004F9F" }}>Apply Now</a>
              )}
              <button onClick={() => { toggleSave(detailOpp.id); setDetailOpp(null); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold border hover:bg-gray-50" style={{ color: saved[detailOpp.id] ? "#FFB81C" : "#004F9F", borderColor: saved[detailOpp.id] ? "#FFB81C" : "#004F9F" }}>
                {saved[detailOpp.id] ? "Saved ✓" : "Save"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <span style={{ color: "#004F9F" }}>Opportunities</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#004F9F" }}>Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">Scholarships, fellowships, and hackathons matched to your profile.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalendarView(!calendarView)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ color: "#004F9F", borderColor: "#004F9F" }}
          >
            {calendarView ? "List View" : "Calendar View"}
          </button>
          <button
            onClick={handleExportCSV}
            className="text-xs font-semibold px-3 py-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ color: "#004F9F", borderColor: "#004F9F" }}
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-semibold px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#004F9F" }}
          >
            + Add Opportunity
          </button>
        </div>
      </div>

      {/* Search + sort + amount filter */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Search by keyword, major, tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 w-64"
        />
        <select
          value={amountFilter}
          onChange={(e) => setAmountFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
        >
          {amountFilters.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
        >
          {sortOptions.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={
              filter === type
                ? { backgroundColor: "#004F9F", color: "#fff", borderColor: "#004F9F" }
                : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }
            }
          >
            {type}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {calendarView && (() => {
        const today = new Date();
        const startWeekday = new Date(calendarDate.year, calendarDate.month, 1).getDay();
        const daysInMonth = new Date(calendarDate.year, calendarDate.month + 1, 0).getDate();
        const prevMonth = () => setCalendarDate(({ year, month }) =>
          month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
        );
        const nextMonth = () => setCalendarDate(({ year, month }) =>
          month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
        );
        return (
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="text-sm px-2 py-1 rounded hover:bg-gray-100" style={{ color: "#004F9F" }}>‹</button>
              <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>
                {MONTH_NAMES[calendarDate.month]} {calendarDate.year}
              </h2>
              <button onClick={nextMonth} className="text-sm px-2 py-1 rounded hover:bg-gray-100" style={{ color: "#004F9F" }}>›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="font-semibold text-gray-400 pb-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startWeekday }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const opp = deadlineDayMap[day];
                const hasDeadline = !!opp;
                const isToday = today.getFullYear() === calendarDate.year && today.getMonth() === calendarDate.month && today.getDate() === day;
                const isSelected = selectedDay === day;
                return (
                  <div
                    key={day}
                    onClick={() => hasDeadline && setSelectedDay(isSelected ? null : day)}
                    className="relative h-10 flex flex-col items-center justify-center rounded-lg text-sm"
                    style={{
                      cursor: hasDeadline ? "pointer" : "default",
                      ...(isSelected
                        ? { backgroundColor: "#003a75", color: "#fff", fontWeight: 700 }
                        : hasDeadline
                        ? { backgroundColor: "#004F9F", color: "#fff", fontWeight: 700 }
                        : isToday
                        ? { backgroundColor: "#FFB81C", color: "#003a75", fontWeight: 700 }
                        : { color: "#374151" }),
                    }}
                  >
                    {day}
                    {hasDeadline && !isSelected && (
                      <span className="absolute bottom-0.5 leading-none" style={{ color: "#FFB81C", fontSize: "6px" }}>●</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected day detail panel */}
            {selectedDay && deadlineDayMap[selectedDay] && (() => {
              const opp = deadlineDayMap[selectedDay];
              return (
                <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: "#004F9F", backgroundColor: "#f0f7ff" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: typeColors[opp.type] ?? "#004F9F" }}>{opp.type}</span>
                        <span className="text-xs text-gray-500">Due {opp.deadline}</span>
                      </div>
                      <p className="font-bold text-gray-800 text-sm">{opp.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opp.description}</p>
                      {opp.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {opp.tags.map((t: string) => <span key={t} className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "#004F9F", color: "#004F9F" }}>{t}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-base" style={{ color: "#FFB81C" }}>{opp.amount}</p>
                      <a href={opp.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold px-3 py-1 rounded-lg text-white" style={{ backgroundColor: "#004F9F" }}>Apply</a>
                    </div>
                  </div>
                </div>
              );
            })()}

            <p className="text-xs text-gray-400 mt-3">Blue = deadline · Gold = today · Click a deadline to see details.</p>
          </div>
        );
      })()}

      {/* Cards */}
      <div className="flex flex-col gap-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-400 text-sm">No opportunities match your current filters.</p>
          </div>
        )}

        {filtered.map((opp) => {
          const status    = statuses[opp.id] ?? "Not Started" as Status;
          const sc        = statusColors[status];
          const isSaved   = saved[opp.id];
          const showInsight = openInsight === opp.id;

          return (
            <div key={opp.id} className="bg-white border border-gray-100 rounded-lg shadow-sm p-5">

              {/* Top row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: typeColors[opp.type] }}
                    >
                      {opp.type}
                    </span>
                    <DeadlineBadge days={opp.deadlineDays} />
                    {isSaved && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                        Saved
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base leading-snug cursor-pointer hover:underline" style={{ color: "#004F9F" }} onClick={() => setDetailOpp(opp)}>{opp.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{opp.description}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-xl font-bold" style={{ color: "#FFB81C" }}>{opp.amount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Due: {opp.deadline}</p>
                </div>
              </div>

              {/* AI Match insight */}
              <button
                onClick={() => setOpenInsight(showInsight ? null : opp.id)}
                className="flex items-center gap-1.5 mb-3 text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "#004F9F" }}
              >
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-bold"
                  style={{ backgroundColor: "#004F9F", fontSize: 8 }}
                >
                  AI
                </span>
                {opp.matchScore}% match — {showInsight ? "Hide insight" : "Why this matches you"}
              </button>
              {showInsight && (
                <div
                  className="mb-3 px-3 py-2 rounded-lg text-xs text-gray-700"
                  style={{ backgroundColor: "#f0f7ff" }}
                >
                  <strong style={{ color: "#004F9F" }}>Match reason: </strong>{opp.matchReason}
                </div>
              )}

              {/* Tags */}
              <div className="flex gap-2 flex-wrap mb-3">
                {opp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-lg border"
                    style={{ borderColor: "#004F9F", color: "#004F9F" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status */}
                <select
                  value={status}
                  onChange={(e) => setStatus(opp.id, e.target.value as Status)}
                  className="text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer"
                  style={{ backgroundColor: sc.bg, color: sc.color }}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>

                {/* Save */}
                <button
                  onClick={() => toggleSave(opp.id)}
                  className="text-xs font-semibold px-3 py-1 rounded-lg border transition-colors"
                  style={
                    isSaved
                      ? { backgroundColor: "#FFB81C", color: "#003a75", borderColor: "#FFB81C" }
                      : { color: "#004F9F", borderColor: "#004F9F" }
                  }
                >
                  {isSaved ? "Saved ✓" : "Save"}
                </button>

                {/* Visit site */}
                <a
                  href={opp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#004F9F" }}
                >
                  Visit Site
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 10L10 2M10 2H5M10 2V7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>

                {/* Not interested */}
                <button
                  onClick={() => dismiss(opp.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                >
                  Not interested
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
