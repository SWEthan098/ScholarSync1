"use client";

import Link from "next/link";

const tuition = {
  total: 32000,
  paid: 8000,
  aidApplied: 6000,
  remaining: 18000,
};

const spending = [
  { category: "Food & Dining", amount: 340, flag: true, note: "High — consider cooking more" },
  { category: "Transportation", amount: 120, flag: false, note: "On track" },
  { category: "Entertainment", amount: 210, flag: true, note: "High for a student budget" },
  { category: "Books & Supplies", amount: 85, flag: false, note: "On track" },
  { category: "Subscriptions", amount: 45, flag: false, note: "On track" },
];

const projections = [
  { career: "Software Engineer", salary: 105000, payoff: "1.5 years" },
  { career: "Cybersecurity Analyst", salary: 92000, payoff: "2 years" },
  { career: "Data Scientist", salary: 80000, payoff: "3 years" },
];

export default function Finance() {
  const paidPercent = Math.round(((tuition.paid + tuition.aidApplied) / tuition.total) * 100);

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8" style={{ color: "#012169" }}>
        Financial Overview
      </h1>

      {/* Tuition Section */}
      <section className="border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#012169" }}>
          Tuition Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-sm">Total Tuition</p>
            <p className="text-xl font-bold" style={{ color: "#012169" }}>
              ${tuition.total.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Paid</p>
            <p className="text-xl font-bold text-green-600">${tuition.paid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Aid Applied</p>
            <p className="text-xl font-bold text-green-600">${tuition.aidApplied.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Remaining</p>
            <p className="text-xl font-bold" style={{ color: "#E31837" }}>
              ${tuition.remaining.toLocaleString()}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="h-3 rounded-full"
            style={{ width: `${paidPercent}%`, backgroundColor: "#E31837" }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">{paidPercent}% covered</p>
      </section>

      {/* Spending Section */}
      <section className="border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#012169" }}>
          Spending This Month
        </h2>
        <p className="text-sm text-gray-400 mb-4">Connected via bank account</p>
        <div className="flex flex-col gap-3">
          {spending.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-800">{item.category}</p>
                <p className={`text-sm ${item.flag ? "text-red-500" : "text-green-600"}`}>
                  {item.note}
                </p>
              </div>
              <p
                className="text-lg font-bold"
                style={{ color: item.flag ? "#E31837" : "#012169" }}
              >
                ${item.amount}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Debt Payoff Projections */}
      <section className="border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#012169" }}>
          Debt Payoff Projections
        </h2>
        <div className="flex flex-col gap-3">
          {projections.map((p) => (
            <div
              key={p.career}
              className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-800">{p.career}</p>
                <p className="text-sm text-gray-400">Est. starting salary: ${p.salary.toLocaleString()}</p>
              </div>
              <p className="font-bold" style={{ color: "#E31837" }}>
                {p.payoff}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
