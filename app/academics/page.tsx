"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MOCK_SCHEDULE = [
  { code: "COMP 310", name: "Data Structures & Algorithms", days: ["M","W","F"], time: "9:00 AM", credits: 3, building: "McNair Hall 101", syllabus: "#" },
  { code: "COMP 340", name: "Computer Organization", days: ["T","R"], time: "11:00 AM", credits: 3, building: "McNair Hall 204", syllabus: "#" },
  { code: "MATH 230", name: "Calculus III", days: ["M","W","F"], time: "1:00 PM", credits: 3, building: "Marteena Hall 301", syllabus: "#" },
  { code: "COMP 380", name: "Software Engineering", days: ["T","R"], time: "2:00 PM", credits: 3, building: "McNair Hall 105", syllabus: "#" },
  { code: "ENGL 201", name: "Technical Writing", days: ["M","W"], time: "3:30 PM", credits: 3, building: "Morrow Hall 202", syllabus: "#" },
];

const MOCK_TRANSCRIPT = [
  { code: "COMP 210", name: "Intro to Programming", semester: "Fall 2024", grade: "A", gpa: 4.0, credits: 3 },
  { code: "MATH 130", name: "Calculus I", semester: "Fall 2024", grade: "B+", gpa: 3.3, credits: 3 },
  { code: "COMP 220", name: "Object-Oriented Programming", semester: "Spring 2025", grade: "A-", gpa: 3.7, credits: 3 },
  { code: "MATH 140", name: "Calculus II", semester: "Spring 2025", grade: "B", gpa: 3.0, credits: 3 },
  { code: "COMP 250", name: "Discrete Mathematics", semester: "Spring 2025", grade: "B+", gpa: 3.3, credits: 3 },
];

const MOCK_DROP_ADVISOR = [
  { code: "MATH 230", name: "Calculus III", currentGrade: "D+", risk: "high", creditCost: "$1,200", advice: "Dropping would protect your GPA. Consider tutoring first.", dropDeadline: "March 28, 2026", daysUntilDrop: 11 },
  { code: "COMP 340", name: "Computer Organization", currentGrade: "C", risk: "medium", creditCost: "$1,200", advice: "Borderline — visit office hours before deciding.", dropDeadline: "March 28, 2026", daysUntilDrop: 11 },
];

const semGPA = 3.2;
const creditsRequired = 120;

const gradePoints: Record<string, number> = { "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0 };
const gradeOptions = Object.keys(gradePoints);

const gradeColor = (g: string) => {
  if (g.startsWith("A")) return "#16a34a";
  if (g.startsWith("B")) return "#004F9F";
  if (g.startsWith("C")) return "#d97706";
  return "#dc2626";
};

const calDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const dayMap: Record<string, string> = { M: "Mon", T: "Tue", W: "Wed", R: "Thu", F: "Fri" };
const courseColors = ["#004F9F", "#FFB81C", "#7c3aed", "#059669", "#dc2626"];
const sortOptions = ["Default", "Grade", "Credits", "Term"];

export default function Academics() {
  const [schedule, setSchedule] = useState(MOCK_SCHEDULE);
  const [transcript, setTranscript] = useState(MOCK_TRANSCRIPT);
  const [dropAdvisor, setDropAdvisor] = useState(MOCK_DROP_ADVISOR);

  const cumGPA = +(transcript.reduce((s, c) => s + c.gpa * c.credits, 0) / transcript.reduce((s, c) => s + c.credits, 0)).toFixed(2);
  const creditsEarned = transcript.reduce((s, c) => s + c.credits, 0);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const userId = process.env.NEXT_PUBLIC_DEMO_USER_ID;
    if (!API || !userId) return;
    fetch(`${API}/school/academics/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.schedule) && data.schedule.length > 0) setSchedule(data.schedule);
        if (Array.isArray(data?.transcript) && data.transcript.length > 0) setTranscript(data.transcript);
        if (Array.isArray(data?.dropAdvisor)) setDropAdvisor(data.dropAdvisor);
        else if (Array.isArray(data?.drop_advisor)) setDropAdvisor(data.drop_advisor);
      })
      .catch(() => {});
  }, []);

  const [calView, setCalView] = useState(false);
  const [txSort, setTxSort] = useState("Default");
  const [txSearch, setTxSearch] = useState("");
  const [whatIfGrades, setWhatIfGrades] = useState<Record<string, string>>({});
  const [showWhatIf, setShowWhatIf] = useState(false);

  const filteredTx = [...transcript]
    .filter((c) => c.name.toLowerCase().includes(txSearch.toLowerCase()) || c.code.toLowerCase().includes(txSearch.toLowerCase()))
    .sort((a, b) => {
      if (txSort === "Grade") return b.gpa - a.gpa;
      if (txSort === "Credits") return b.credits - a.credits;
      if (txSort === "Term") return a.semester.localeCompare(b.semester);
      return 0;
    });

  const whatIfGPA = (() => {
    const base = transcript.map((c) => ({ gpa: c.gpa, credits: c.credits }));
    const current = schedule.map((c) => ({ credits: c.credits, gpa: gradePoints[whatIfGrades[c.code] ?? "B"] ?? 3.0 }));
    const all = [...base, ...current];
    return +(all.reduce((s, c) => s + c.gpa * c.credits, 0) / all.reduce((s, c) => s + c.credits, 0)).toFixed(2);
  })();

  return (
    <div className="max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <span style={{ color: "#004F9F" }}>Academics</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "#004F9F" }}>Academics</h1>

      {/* GPA + Credit summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cumulative GPA</p>
          <p className="text-3xl font-bold" style={{ color: cumGPA >= 3.5 ? "#16a34a" : cumGPA >= 2.5 ? "#004F9F" : "#dc2626" }}>{cumGPA}</p>
          <p className="text-xs text-gray-400 mt-1">out of 4.0</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Semester GPA</p>
          <p className="text-3xl font-bold" style={{ color: "#FFB81C" }}>{semGPA}</p>
          <p className="text-xs text-gray-400 mt-1">Spring 2026 (in progress)</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5 sm:col-span-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Credits Toward Graduation</p>
          <p className="text-2xl font-bold mb-2" style={{ color: "#004F9F" }}>{creditsEarned} <span className="text-sm font-normal text-gray-400">/ {creditsRequired}</span></p>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full" style={{ width: `${(creditsEarned / creditsRequired) * 100}%`, backgroundColor: "#004F9F" }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{creditsRequired - creditsEarned} credits remaining</p>
        </div>
      </div>

      {/* Schedule */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>Schedule — Spring 2026</h2>
          <button onClick={() => setCalView(!calView)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50" style={{ color: "#004F9F", borderColor: "#004F9F" }}>
            {calView ? "List View" : "Calendar View"}
          </button>
        </div>

        {calView ? (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-5 gap-2 min-w-[480px]">
              {calDays.map((d) => (
                <div key={d} className="text-xs font-bold text-center pb-2 border-b" style={{ color: "#004F9F" }}>{d}</div>
              ))}
              {calDays.map((day) => (
                <div key={day} className="flex flex-col gap-1 pt-2 min-h-[120px]">
                  {schedule.map((c, ci) =>
                    c.days.some((d) => dayMap[d] === day) ? (
                      <div key={c.code} className="rounded p-1.5 text-white text-xs" style={{ backgroundColor: courseColors[ci % courseColors.length] }}>
                        <p className="font-bold">{c.code}</p>
                        <p className="opacity-80">{c.time}</p>
                      </div>
                    ) : null
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {schedule.map((c, ci) => (
              <div key={c.code} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: courseColors[ci % courseColors.length] }} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.code} · {c.days.join("/")} {c.time} · {c.building}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(c.building + " NCAT Greensboro")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:underline">Map</a>
                  <a href={c.syllabus} className="text-xs font-semibold px-2 py-1 rounded-lg border hover:bg-gray-50" style={{ color: "#004F9F", borderColor: "#004F9F" }}>Syllabus</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* What-If GPA Simulator */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>What-If GPA Simulator</h2>
          <button onClick={() => setShowWhatIf(!showWhatIf)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50" style={{ color: "#004F9F", borderColor: "#004F9F" }}>
            {showWhatIf ? "Hide" : "Open Simulator"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">See how projected grades this semester will affect your cumulative GPA.</p>
        {showWhatIf && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {schedule.map((c) => (
                <div key={c.code} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.code}</p>
                    <p className="text-xs text-gray-400">{c.name}</p>
                  </div>
                  <select value={whatIfGrades[c.code] ?? "B"} onChange={(e) => setWhatIfGrades((p) => ({ ...p, [c.code]: e.target.value }))} className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none ml-3">
                    {gradeOptions.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: "#f0f7ff" }}>
              <div>
                <p className="text-xs text-gray-500">Current GPA</p>
                <p className="text-2xl font-bold" style={{ color: "#004F9F" }}>{cumGPA}</p>
              </div>
              <span className="text-xl text-gray-300">→</span>
              <div>
                <p className="text-xs text-gray-500">Projected GPA</p>
                <p className="text-2xl font-bold" style={{ color: whatIfGPA >= cumGPA ? "#16a34a" : "#dc2626" }}>{whatIfGPA}</p>
              </div>
              <p className="text-xs text-gray-400 ml-2">
                {whatIfGPA >= cumGPA ? `↑ +${(whatIfGPA - cumGPA).toFixed(2)}` : `↓ ${(cumGPA - whatIfGPA).toFixed(2)}`} change
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Transcript */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>Transcript</h2>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Search courses..." value={txSearch} onChange={(e) => setTxSearch(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none w-40" />
            <select value={txSort} onChange={(e) => setTxSort(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
              {sortOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {filteredTx.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No courses found.</p>}
          {filteredTx.map((c) => (
            <div key={`${c.code}-${c.semester}`} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">{c.code} · {c.semester} · {c.credits} credits</p>
              </div>
              <p className="text-xl font-bold" style={{ color: gradeColor(c.grade) }}>{c.grade}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Course Drop Advisor */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-base mb-1" style={{ color: "#004F9F" }}>Course Drop Advisor</h2>
        <p className="text-xs text-gray-400 mb-4">AI flags courses where you may want to consider dropping based on your current grade and financial cost.</p>
        <div className="flex flex-col gap-4">
          {dropAdvisor.map((c) => (
            <div key={c.code} className="border rounded-lg px-5 py-4" style={{ borderColor: c.risk === "high" ? "#dc2626" : "#f59e0b" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.code} · Drop cost: {c.creditCost}</p>
                </div>
                <p className="text-xl font-bold ml-4" style={{ color: c.risk === "high" ? "#dc2626" : "#f59e0b" }}>{c.currentGrade}</p>
              </div>
              <p className="text-sm text-gray-600 mb-3">{c.advice}</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50">
                <span className="text-xs font-bold text-red-600">Drop Deadline:</span>
                <span className="text-xs text-red-600">{c.dropDeadline} — {c.daysUntilDrop} days remaining</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
