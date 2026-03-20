"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

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
  const { user } = useAuth();
  const hasLoaded = useRef(false);
  const [schedule, setSchedule] = useState(MOCK_SCHEDULE);
  const [transcript, setTranscript] = useState(MOCK_TRANSCRIPT);
  const [calView, setCalView] = useState(false);
  const [txSort, setTxSort] = useState("Default");
  const [txSearch, setTxSearch] = useState("");
  const [currentGrades, setCurrentGrades] = useState<Record<string, string>>({});
  const [editableTranscript, setEditableTranscript] = useState<Record<string, string>>(
    Object.fromEntries(MOCK_TRANSCRIPT.map((c) => [`${c.code}-${c.semester}`, c.grade]))
  );
  const [editableCredits, setEditableCredits] = useState<Record<string, number>>({});

  // Past courses with editable grades + credits
  const pastPts = transcript.reduce((s, c) => {
    const key = `${c.code}-${c.semester}`;
    const gp = gradePoints[editableTranscript[key] ?? c.grade] ?? c.gpa;
    const creds = editableCredits[key] ?? c.credits;
    return s + gp * creds;
  }, 0);
  const pastCreds = transcript.reduce((s, c) => s + (editableCredits[`${c.code}-${c.semester}`] ?? c.credits), 0);

  // Current semester courses that have grades entered
  const gradedCurrent = schedule.filter((c) => currentGrades[c.code]);
  const currentPts = gradedCurrent.reduce((s, c) => s + (gradePoints[currentGrades[c.code]] ?? 0) * (editableCredits[`${c.code}-current`] ?? c.credits), 0);
  const currentCreds = gradedCurrent.reduce((s, c) => s + (editableCredits[`${c.code}-current`] ?? c.credits), 0);

  const cumGPA = (pastCreds + currentCreds) > 0 ? +((pastPts + currentPts) / (pastCreds + currentCreds)).toFixed(2) : 0;
  const creditsEarned = pastCreds + currentCreds;
  const semGPA = (() => {
    if (gradedCurrent.length === 0) return null;
    return +(currentPts / currentCreds).toFixed(2);
  })();

  // Load saved grades from localStorage
  useEffect(() => {
    const k = user?.id ?? "demo";
    const saved = localStorage.getItem(`academics_${k}`);
    if (saved) {
      const { currentGrades: cg, editableTranscript: et, editableCredits: ec } = JSON.parse(saved);
      if (cg) setCurrentGrades(cg);
      if (et) setEditableTranscript(et);
      if (ec) setEditableCredits(ec);
    }
    hasLoaded.current = true;
  }, [user?.id]);

  // Auto-save whenever grades change (only after initial load)
  useEffect(() => {
    if (!hasLoaded.current) return;
    const k = user?.id ?? "demo";
    localStorage.setItem(`academics_${k}`, JSON.stringify({ currentGrades, editableTranscript, editableCredits }));
  }, [currentGrades, editableTranscript, editableCredits, user?.id]);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const userId = user?.id ?? process.env.NEXT_PUBLIC_DEMO_USER_ID;
    if (!API || !userId) return;
    fetch(`${API}/school/academics/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.schedule) && data.schedule.length > 0) setSchedule(data.schedule);
        if (Array.isArray(data?.transcript) && data.transcript.length > 0) setTranscript(data.transcript);
      })
      .catch(() => {});
  }, [user?.id]);

  const filteredTx = [...transcript]
    .filter((c) => c.name.toLowerCase().includes(txSearch.toLowerCase()) || c.code.toLowerCase().includes(txSearch.toLowerCase()))
    .sort((a, b) => {
      if (txSort === "Grade") return b.gpa - a.gpa;
      if (txSort === "Credits") return b.credits - a.credits;
      if (txSort === "Term") return a.semester.localeCompare(b.semester);
      return 0;
    });


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
          <p className="text-3xl font-bold" style={{ color: "#FFB81C" }}>{semGPA ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-1">{semGPA != null ? "Live from current grades" : "Enter grades in schedule"}</p>
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
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Grade:</span>
                    <select
                      value={currentGrades[c.code] ?? ""}
                      onChange={(e) => setCurrentGrades((p) => ({ ...p, [c.code]: e.target.value }))}
                      className="text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none"
                      style={{ color: currentGrades[c.code] ? gradeColor(currentGrades[c.code]) : "#9ca3af" }}
                    >
                      <option value="">--</option>
                      {gradeOptions.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(c.building + " NCAT Greensboro")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:underline">Map</a>
                  <a href={c.syllabus} className="text-xs font-semibold px-2 py-1 rounded-lg border hover:bg-gray-50" style={{ color: "#004F9F", borderColor: "#004F9F" }}>Syllabus</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transcript */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>Transcript</h2>
            <p className="text-xs text-gray-400 mt-0.5">Edit grades or credits to update your GPA instantly.</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Search courses..." value={txSearch} onChange={(e) => setTxSearch(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none w-40" />
            <select value={txSort} onChange={(e) => setTxSort(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
              {sortOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Current semester */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-1">Spring 2026 — In Progress</p>
        <div className="flex flex-col gap-2 mb-4">
          {schedule
            .filter((c) => c.name.toLowerCase().includes(txSearch.toLowerCase()) || c.code.toLowerCase().includes(txSearch.toLowerCase()))
            .map((c) => {
              const key = `${c.code}-current`;
              const grade = currentGrades[c.code] ?? "";
              const credits = editableCredits[key] ?? c.credits;
              return (
                <div key={key} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 bg-blue-50/30">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">{c.code} · Spring 2026</p>
                      <span className="text-xs text-gray-300">·</span>
                      <input
                        type="number" min="1" max="6" step="1"
                        value={credits}
                        onChange={(e) => setEditableCredits((p) => ({ ...p, [key]: parseInt(e.target.value) || c.credits }))}
                        className="w-8 text-xs text-gray-500 border-b border-gray-300 focus:outline-none bg-transparent text-center"
                        title="Edit credits"
                      />
                      <span className="text-xs text-gray-400">cr</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={grade}
                      onChange={(e) => setCurrentGrades((p) => ({ ...p, [c.code]: e.target.value }))}
                      className="text-lg font-bold border-0 focus:outline-none bg-transparent cursor-pointer"
                      style={{ color: grade ? gradeColor(grade) : "#9ca3af" }}
                    >
                      <option value="">IP</option>
                      {gradeOptions.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Past semesters */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Completed Courses</p>
        <div className="flex flex-col gap-2">
          {filteredTx.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No courses found.</p>}
          {filteredTx.map((c) => {
            const key = `${c.code}-${c.semester}`;
            const grade = editableTranscript[key] ?? c.grade;
            const credits = editableCredits[key] ?? c.credits;
            return (
              <div key={key} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{c.code} · {c.semester}</p>
                    <span className="text-xs text-gray-300">·</span>
                    <input
                      type="number" min="1" max="6" step="1"
                      value={credits}
                      onChange={(e) => setEditableCredits((p) => ({ ...p, [key]: parseInt(e.target.value) || c.credits }))}
                      className="w-8 text-xs text-gray-500 border-b border-gray-300 focus:outline-none bg-transparent text-center"
                      title="Edit credits"
                    />
                    <span className="text-xs text-gray-400">cr</span>
                  </div>
                </div>
                <select
                  value={grade}
                  onChange={(e) => setEditableTranscript((p) => ({ ...p, [key]: e.target.value }))}
                  className="text-lg font-bold border-0 focus:outline-none bg-transparent cursor-pointer"
                  style={{ color: gradeColor(grade) }}
                >
                  {gradeOptions.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      {/* Course Drop Advisor */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-base mb-1" style={{ color: "#004F9F" }}>Course Drop Advisor</h2>
        <p className="text-xs text-gray-400 mb-4">Flags current courses where your grade has fallen below a C−. Enter your grades above to see recommendations.</p>
        {(() => {
          const atRisk = schedule.filter((c) => {
            const g = currentGrades[c.code];
            return g && (gradePoints[g] ?? 4.0) < 1.7;
          });
          if (atRisk.length === 0) {
            return <p className="text-sm text-gray-400 text-center py-6">No at-risk courses. Enter your current grades in the schedule above to get recommendations.</p>;
          }
          return (
            <div className="flex flex-col gap-4">
              {atRisk.map((c) => {
                const grade = currentGrades[c.code];
                const gpa = gradePoints[grade] ?? 0;
                const risk = gpa < 1.0 ? "high" : "medium";
                return (
                  <div key={c.code} className="border rounded-lg px-5 py-4" style={{ borderColor: risk === "high" ? "#dc2626" : "#f59e0b" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.code} · Drop cost: $1,200</p>
                      </div>
                      <p className="text-xl font-bold ml-4" style={{ color: risk === "high" ? "#dc2626" : "#f59e0b" }}>{grade}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {risk === "high" ? "Dropping would protect your GPA. Consider tutoring first." : "Borderline — visit office hours before deciding."}
                    </p>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50">
                      <span className="text-xs font-bold text-red-600">Drop Deadline:</span>
                      <span className="text-xs text-red-600">March 28, 2026 — 9 days remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
