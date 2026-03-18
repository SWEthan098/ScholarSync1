"use client";

import Link from "next/link";

const schedule = [
  { code: "COMP 310", name: "Data Structures & Algorithms", time: "MWF 9:00 AM", credits: 3 },
  { code: "COMP 340", name: "Computer Organization", time: "TR 11:00 AM", credits: 3 },
  { code: "MATH 230", name: "Calculus III", time: "MWF 1:00 PM", credits: 3 },
  { code: "COMP 380", name: "Software Engineering", time: "TR 2:00 PM", credits: 3 },
  { code: "ENGL 201", name: "Technical Writing", time: "MW 3:30 PM", credits: 3 },
];

const transcript = [
  { code: "COMP 210", name: "Introduction to Programming", semester: "Fall 2024", grade: "A", credits: 3 },
  { code: "MATH 130", name: "Calculus I", semester: "Fall 2024", grade: "B+", credits: 3 },
  { code: "COMP 220", name: "Object-Oriented Programming", semester: "Spring 2025", grade: "A-", credits: 3 },
  { code: "MATH 140", name: "Calculus II", semester: "Spring 2025", grade: "B", credits: 3 },
  { code: "COMP 250", name: "Discrete Mathematics", semester: "Spring 2025", grade: "B+", credits: 3 },
];

const dropAdvisor = [
  {
    code: "MATH 230",
    name: "Calculus III",
    currentGrade: "D+",
    risk: "high",
    creditCost: "$1,200",
    advice: "Dropping would cost $1,200 but protect your GPA. Consider tutoring first.",
  },
  {
    code: "COMP 340",
    name: "Computer Organization",
    currentGrade: "C",
    risk: "medium",
    creditCost: "$1,200",
    advice: "Borderline — visit office hours before deciding to drop.",
  },
];

const gradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "text-green-600";
  if (grade.startsWith("B")) return "#012169";
  if (grade.startsWith("C")) return "text-yellow-600";
  return "#E31837";
};

export default function Academics() {
  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8" style={{ color: "#012169" }}>
        Academics
      </h1>

      {/* Current Schedule */}
      <section className="border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#012169" }}>
          Current Schedule — Spring 2026
        </h2>
        <div className="flex flex-col gap-3">
          {schedule.map((course) => (
            <div
              key={course.code}
              className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-800">{course.name}</p>
                <p className="text-sm text-gray-400">{course.code} · {course.time}</p>
              </div>
              <p className="text-sm font-medium" style={{ color: "#012169" }}>
                {course.credits} credits
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Transcript */}
      <section className="border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#012169" }}>
          Transcript
        </h2>
        <div className="flex flex-col gap-3">
          {transcript.map((course) => (
            <div
              key={`${course.code}-${course.semester}`}
              className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-800">{course.name}</p>
                <p className="text-sm text-gray-400">{course.code} · {course.semester}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${gradeColor(course.grade)}`}>
                  {course.grade}
                </p>
                <p className="text-xs text-gray-400">{course.credits} credits</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Course Drop Advisor */}
      <section className="border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#012169" }}>
          Course Drop Advisor
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          AI flags courses where dropping may be worth considering based on your grade and cost.
        </p>
        <div className="flex flex-col gap-4">
          {dropAdvisor.map((course) => (
            <div
              key={course.code}
              className="border rounded-2xl px-5 py-4"
              style={{ borderColor: course.risk === "high" ? "#E31837" : "#f59e0b" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{course.name}</p>
                  <p className="text-sm text-gray-400">{course.code}</p>
                </div>
                <div className="text-right">
                  <p
                    className="text-xl font-bold"
                    style={{ color: course.risk === "high" ? "#E31837" : "#f59e0b" }}
                  >
                    {course.currentGrade}
                  </p>
                  <p className="text-xs text-gray-400">Drop cost: {course.creditCost}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">{course.advice}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
