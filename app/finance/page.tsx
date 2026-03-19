"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const tuition = { total: 32000, paid: 8000, aidApplied: 6000, remaining: 18000 };

const MOCK_SPENDING = [
  { category: "Food & Dining", amount: 340, budget: 290, flag: true, trend: 12, transactions: ["DoorDash $34.50", "Chick-fil-A $12.80", "Harris Teeter $48.20"] },
  { category: "Transportation", amount: 120, budget: 150, flag: false, trend: -5, transactions: ["Uber $18.00", "Gas $42.00", "Parking $60.00"] },
  { category: "Entertainment", amount: 210, budget: 100, flag: true, trend: 22, transactions: ["Cinema $24.00", "Xbox Game Pass $14.99", "Concert $80.00"] },
  { category: "Books & Supplies", amount: 85, budget: 100, flag: false, trend: -3, transactions: ["Amazon $42.00", "Campus Bookstore $43.00"] },
  { category: "Subscriptions", amount: 45, budget: 60, flag: false, trend: 0, transactions: ["Spotify $9.99", "Netflix $15.99", "iCloud $2.99"] },
];

const projections = [
  { career: "Software Engineer", salary: 105000, payoff: "1.5 years" },
  { career: "Cybersecurity Analyst", salary: 92000, payoff: "2 years" },
  { career: "Data Scientist", salary: 80000, payoff: "3 years" },
];

interface ManualEntry { name: string; category: string; amount: string; }

const expenseCategories = ["Food & Dining", "Transportation", "Entertainment", "Books & Supplies", "Subscriptions", "Other"];
const incomeCategories = ["Scholarship", "Internship", "Part-time Job", "Other Income"];
const dateRanges = ["This Month", "Last Month", "This Semester", "This Year"];

// Donut chart — simple SVG
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const donutColors = ["#004F9F", "#FFB81C", "#dc2626", "#10b981", "#8b5cf6"];

function DonutChart({ data, total }: { data: typeof MOCK_SPENDING; total: number }) {
  let offset = 0;
  const slices = data.map((item, i) => {
    const pct = item.amount / total;
    const dash = pct * CIRCUMFERENCE;
    const slice = { offset, dash, color: donutColors[i] };
    offset += dash;
    return slice;
  });

  return (
    <svg viewBox="0 0 100 100" width="120" height="120" className="shrink-0">
      {slices.map((s, i) => (
        <circle
          key={i}
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke={s.color}
          strokeWidth="18"
          strokeDasharray={`${s.dash} ${CIRCUMFERENCE - s.dash}`}
          strokeDashoffset={-s.offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      ))}
      <text x="50" y="54" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#004F9F">
        ${total}
      </text>
    </svg>
  );
}

export default function Finance() {
  const [spending, setSpending] = useState(MOCK_SPENDING);
  const totalSpend = spending.reduce((s, i) => s + i.amount, 0);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const userId = process.env.NEXT_PUBLIC_DEMO_USER_ID;
    if (!API || !userId) return;
    fetch(`${API}/bank/finance/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.spending) && data.spending.length > 0) setSpending(data.spending);
      })
      .catch(() => {});
  }, []);

  const paidPct = Math.round(((tuition.paid + tuition.aidApplied) / tuition.total) * 100);
  const [dateRange, setDateRange] = useState("This Month");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editBudgets, setEditBudgets] = useState(false);
  const [budgets, setBudgets] = useState<Record<string, number>>(
    Object.fromEntries(spending.map((s) => [s.category, s.budget]))
  );
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"expense" | "income">("expense");
  const [form, setForm] = useState<ManualEntry>({ name: "", category: "Food & Dining", amount: "" });

  const openModal = (type: "expense" | "income") => {
    setModalType(type);
    setForm({ name: "", category: type === "income" ? "Scholarship" : "Food & Dining", amount: "" });
    setShowModal(true);
  };

  const handleLogTransaction = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In production this would persist to Supabase — for now just close
    setShowModal(false);
    setForm({ name: "", category: "Food & Dining", amount: "" });
  };

  const filteredSpending = spending.filter((s) =>
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const rows = [
      ["Category", "Amount", "Budget", "Status"],
      ...spending.map((s) => [s.category, `$${s.amount}`, `$${s.budget}`, s.flag ? "High" : "On track"]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scholarsync-finance.csv";
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto">

      {/* Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "#004F9F" }}>
                {modalType === "income" ? "Log Income" : "Log an Expense"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleLogTransaction} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder={modalType === "income" ? "e.g. Scholarship deposit" : "e.g. Grocery run"}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                >
                  {(modalType === "income" ? incomeCategories : expenseCategories).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#004F9F" }}
                >
                  {modalType === "income" ? "Add Income" : "Add Expense"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-gray-50"
                  style={{ color: "#004F9F", borderColor: "#004F9F" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <span style={{ color: "#004F9F" }}>Finance</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#004F9F" }}>Financial Overview</h1>
          <p className="text-sm text-gray-400 mt-1">Connected via bank account</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
          >
            {dateRanges.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button
            onClick={() => openModal("expense")}
            className="text-sm font-semibold px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ color: "#004F9F", borderColor: "#004F9F" }}
          >
            Log Expense
          </button>
          <button
            onClick={() => openModal("income")}
            className="text-sm font-semibold px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ color: "#059669", borderColor: "#059669" }}
          >
            Log Income
          </button>
          {/* Export */}
          <button
            onClick={handleExportCSV}
            className="text-sm font-semibold px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ color: "#004F9F", borderColor: "#004F9F" }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Tuition */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-base mb-4" style={{ color: "#004F9F" }}>Tuition Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Tuition</p>
            <p className="text-xl font-bold" style={{ color: "#004F9F" }}>${tuition.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Paid</p>
            <p className="text-xl font-bold text-green-600">${tuition.paid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Aid Applied</p>
            <p className="text-xl font-bold text-green-600">${tuition.aidApplied.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Remaining</p>
            <p className="text-xl font-bold text-red-600">${tuition.remaining.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
          <div className="h-2.5 rounded-full" style={{ width: `${paidPct}%`, backgroundColor: "#004F9F" }} />
        </div>
        <p className="text-xs text-gray-400">{paidPct}% covered</p>
      </section>

      {/* Spending */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>
              Spending — {dateRange}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Total: ${totalSpend.toLocaleString()}</p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none w-44"
            />
            <button
              onClick={() => setEditBudgets(!editBudgets)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ color: "#004F9F", borderColor: "#004F9F" }}
            >
              {editBudgets ? "Done" : "Edit Limits"}
            </button>
          </div>
        </div>

        <div className="flex gap-6 items-start mb-5">
          {/* Donut */}
          <DonutChart data={spending} total={totalSpend} />
          {/* Legend */}
          <div className="flex flex-col gap-2 justify-center">
            {spending.map((item, i) => (
              <div key={item.category} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: donutColors[i] }} />
                <span className="text-xs text-gray-600">{item.category}</span>
                <span className="text-xs font-semibold ml-1" style={{ color: "#004F9F" }}>
                  {Math.round((item.amount / totalSpend) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {filteredSpending.map((item) => {
            const overBudget = item.amount - item.budget;
            const isExpanded = expandedCategory === item.category;
            return (
              <div key={item.category} className="border border-gray-100 rounded-lg overflow-hidden">
                {/* Row — clickable */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpandedCategory(isExpanded ? null : item.category)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{item.category}</p>
                      {item.flag && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium text-white"
                          style={{ backgroundColor: "#dc2626" }}
                          title={`You've spent $${overBudget} over your $${item.budget} budget`}
                        >
                          High
                        </span>
                      )}
                      {/* Trend */}
                      <span className={`text-xs font-medium ${item.trend > 0 ? "text-red-500" : item.trend < 0 ? "text-green-600" : "text-gray-400"}`}>
                        {item.trend > 0 ? `↑ ${item.trend}%` : item.trend < 0 ? `↓ ${Math.abs(item.trend)}%` : "—"} vs last month
                      </span>
                    </div>
                    {item.flag && (
                      <p className="text-xs text-red-500 mt-0.5">
                        ${overBudget} over your ${item.budget} budget
                      </p>
                    )}
                    {!item.flag && (
                      <p className="text-xs text-green-600 mt-0.5">On track · ${item.budget - item.amount} under budget</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {editBudgets ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-gray-400">Limit $</span>
                        <input
                          type="number"
                          value={budgets[item.category]}
                          onChange={(e) => setBudgets({ ...budgets, [item.category]: Number(e.target.value) })}
                          className="w-16 text-sm border border-gray-200 rounded px-1 py-0.5 text-center"
                        />
                      </div>
                    ) : (
                      <p className="text-base font-bold" style={{ color: item.flag ? "#dc2626" : "#004F9F" }}>
                        ${item.amount}
                      </p>
                    )}
                    <span className="text-gray-400 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Expanded transaction drill-down */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-gray-400 mb-1">Transactions</p>
                    {item.transactions.map((tx, i) => (
                      <p key={i} className="text-sm text-gray-600">• {tx}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Debt Payoff Projections */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-base mb-4" style={{ color: "#004F9F" }}>Debt Payoff Projections</h2>
        <div className="flex flex-col gap-3">
          {projections.map((p) => (
            <div key={p.career} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
              <div>
                <p className="font-medium text-gray-800">{p.career}</p>
                <p className="text-xs text-gray-400">Est. starting salary: ${p.salary.toLocaleString()}</p>
              </div>
              <p className="font-bold text-base" style={{ color: "#004F9F" }}>{p.payoff}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
