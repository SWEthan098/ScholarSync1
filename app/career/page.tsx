"use client";

import Link from "next/link";

const internships = [
  {
    company: "Google",
    role: "Software Engineer Intern",
    location: "Mountain View, CA",
    pay: "$55/hr",
    base: 114000,
    tc: 140000,
    level: "New Grad",
    deadline: "April 15, 2026",
    tags: ["SWE", "Full-time conversion"],
  },
  {
    company: "Microsoft",
    role: "Software Engineer Intern",
    location: "Redmond, WA",
    pay: "$52/hr",
    base: 108000,
    tc: 130000,
    level: "New Grad",
    deadline: "April 30, 2026",
    tags: ["SWE", "Azure", "Full-time conversion"],
  },
  {
    company: "CrowdStrike",
    role: "Cybersecurity Engineer Intern",
    location: "Remote",
    pay: "$45/hr",
    base: 93000,
    tc: 110000,
    level: "New Grad",
    deadline: "May 1, 2026",
    tags: ["Cybersecurity", "Remote"],
  },
  {
    company: "Amazon",
    role: "Cloud Support Engineer Intern",
    location: "Seattle, WA",
    pay: "$50/hr",
    base: 104000,
    tc: 125000,
    level: "New Grad",
    deadline: "April 20, 2026",
    tags: ["Cloud", "AWS"],
  },
  {
    company: "Meta",
    role: "Data Engineer Intern",
    location: "Menlo Park, CA",
    pay: "$58/hr",
    base: 120000,
    tc: 150000,
    level: "New Grad",
    deadline: "April 10, 2026",
    tags: ["Data", "Full-time conversion"],
  },
];

const roadmap = [
  { semester: "Freshman Year", tasks: ["Learn a programming language", "Join a tech club", "Build a small project"] },
  { semester: "Sophomore Year", tasks: ["Earn a certification", "Apply for summer internships", "Start LeetCode practice"] },
  { semester: "Junior Year", tasks: ["Complete a tech internship", "Contribute to open source", "Attend career fairs"] },
  { semester: "Senior Year", tasks: ["Apply for full-time roles", "Polish resume + portfolio", "Prepare for interviews"] },
];

export default function Career() {
  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ color: "#012169" }}>
        Career Explorer
      </h1>
      <p className="text-gray-500 mb-8">
        Internships matched to your profile. Salary data sourced from levels.fyi.
      </p>

      {/* Internship Cards */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#012169" }}>
          Matched Internships
        </h2>
        <div className="flex flex-col gap-4">
          {internships.map((job) => (
            <div
              key={`${job.company}-${job.role}`}
              className="border border-gray-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{job.company}</h3>
                  <p className="text-gray-600">{job.role}</p>
                  <p className="text-sm text-gray-400">{job.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: "#E31837" }}>
                    {job.pay}
                  </p>
                  <p className="text-xs text-gray-400">New Grad Base: ${job.base.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">TC: ${job.tc.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2 flex-wrap">
                  {job.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full border"
                      style={{ borderColor: "#012169", color: "#012169" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-400">Deadline: {job.deadline}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Career Roadmap */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#012169" }}>
          Career Roadmap
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roadmap.map((step) => (
            <div key={step.semester} className="border border-gray-200 rounded-2xl p-5">
              <h3 className="font-semibold mb-3" style={{ color: "#E31837" }}>
                {step.semester}
              </h3>
              <ul className="flex flex-col gap-1">
                {step.tasks.map((task) => (
                  <li key={task} className="text-sm text-gray-600 flex items-start gap-2">
                    <span style={{ color: "#E31837" }}>•</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
