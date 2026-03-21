"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface Profile {
  name: string;
  major: string;
  year: string;
  careerInterest: string;
}

const opportunities = [
  { title: "Google Generation Scholarship", amount: "$10,000", deadline: "Apr 5", urgent: true },
  { title: "HackNC Hackathon", amount: "$2,500", deadline: "Apr 12", urgent: true },
  { title: "AWS Educate Scholarship", amount: "$4,000", deadline: "May 15", urgent: false },
];

const defaultNextSteps = [
  { label: "Complete your student profile", done: true },
  { label: "Link your bank account via Plaid", done: false },
  { label: "Sync your Aggie Access portal", done: false },
  { label: "Set your first career goal", done: false },
];

const CHART_HEIGHT = 80;
const filterChips = ["All", "Income", "Food", "Shopping", "Entertainment", "Subscriptions"];

interface Transaction {
  name: string;
  category: string;
  date: string;
  amount: string;
  income: boolean;
  flag: boolean;
  flagNote: string;
}

const categories = ["Food", "Shopping", "Transportation", "Entertainment", "Subscriptions", "Other"];

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nextSteps, setNextSteps] = useState(defaultNextSteps);
  const [txFilter, setTxFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"expense" | "income">("expense");
  const [form, setForm] = useState({ name: "", category: "Food", amount: "" });
  const [tuitionData, setTuitionData] = useState({ total: 0, paid: 0, aidApplied: 0 });
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("scholar_profile");
    if (stored) setProfile(JSON.parse(stored));
    const storedSteps = localStorage.getItem("scholar_next_steps");
    if (storedSteps) setNextSteps(JSON.parse(storedSteps));

    const key = user?.id ?? "demo";
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Load tuition data
    const savedTuition = localStorage.getItem(`tuition_${key}`);
    if (savedTuition) setTuitionData(JSON.parse(savedTuition));

    // Load manual entries from finance localStorage and convert to transaction format
    const savedSpending = localStorage.getItem(`spending_${key}`);
    const savedIncome = localStorage.getItem(`income_${key}`);
    const manualTx: Transaction[] = [];

    if (savedSpending) {
      const spending = JSON.parse(savedSpending);
      let expTotal = 0;
      spending.forEach((s: any) => {
        expTotal += s.amount ?? 0;
        s.transactions?.forEach((tx: string) => {
          const match = tx.match(/^(.+)\s\$(.+)$/);
          if (match) manualTx.push({ name: match[1], category: s.category, date: today, amount: `-$${match[2]}`, income: false, flag: s.flag, flagNote: "" });
        });
      });
      setTotalExpenses(expTotal);
    }

    if (savedIncome) {
      const income = JSON.parse(savedIncome);
      let incTotal = 0;
      income.forEach((i: any) => {
        incTotal += i.amount ?? 0;
        i.transactions?.forEach((tx: string) => {
          const match = tx.match(/^(.+)\s\$(.+)$/);
          if (match) manualTx.push({ name: match[1], category: "Income", date: today, amount: `+$${match[2]}`, income: true, flag: false, flagNote: "" });
        });
      });
      setTotalIncome(incTotal);
    }

    setTransactions(manualTx);

    const API = process.env.NEXT_PUBLIC_API_URL;
    const userId = user?.id ?? process.env.NEXT_PUBLIC_DEMO_USER_ID;
    if (!API || !userId) return;

    fetch(`${API}/bank/finance/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        const raw: unknown[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.transactions)
          ? data.transactions
          : [];
        if (raw.length === 0) return;
        const mapped: Transaction[] = raw.map((t: any) => ({
          name: t.name ?? t.merchant_name ?? t.merchant ?? t.payee ?? t.title ?? t.description ?? "Transaction",
          category: t.category ?? "Other",
          date: t.date ?? t.created_at ?? "",
          amount: t.amount != null
            ? `${t.amount < 0 || t.type === "debit" ? "-" : "+"}$${Math.abs(Number(t.amount)).toFixed(2)}`
            : t.amount_str ?? "$0.00",
          income: t.type === "credit" || t.income === true || Number(t.amount) > 0,
          flag: t.flag ?? false,
          flagNote: t.flagNote ?? t.flag_note ?? "",
        }));
        setTransactions(mapped);
      })
      .catch(() => {});
  }, [user?.id]);

  const filteredTx = transactions.filter((tx) => {
    const matchesFilter = txFilter === "All" || tx.category === txFilter;
    const matchesSearch = tx.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openModal = (type: "expense" | "income") => {
    setModalType(type);
    setForm({ name: "", category: type === "income" ? "Scholarship" : "Food", amount: "" });
    setShowModal(true);
  };

  const handleLogTransaction = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const isIncome = modalType === "income";
    const amt = parseFloat(form.amount);
    const key = user?.id ?? "demo";

    // Save to finance localStorage so finance page stays in sync
    if (isIncome) {
      const saved = localStorage.getItem(`income_${key}`);
      const income = saved ? JSON.parse(saved) : [];
      const existing = income.find((i: any) => i.category === form.category);
      const updated = existing
        ? income.map((i: any) => i.category === form.category
            ? { ...i, amount: i.amount + amt, transactions: [`${form.name} $${amt.toFixed(2)}`, ...i.transactions] }
            : i)
        : [...income, { category: form.category, amount: amt, transactions: [`${form.name} $${amt.toFixed(2)}`] }];
      localStorage.setItem(`income_${key}`, JSON.stringify(updated));
    } else {
      const saved = localStorage.getItem(`spending_${key}`);
      const spending = saved ? JSON.parse(saved) : [];
      const existing = spending.find((s: any) => s.category === form.category);
      const updated = existing
        ? spending.map((s: any) => s.category === form.category
            ? { ...s, amount: s.amount + amt, transactions: [`${form.name} $${amt.toFixed(2)}`, ...s.transactions], flag: s.amount + amt > s.budget }
            : s)
        : [...spending, { category: form.category, amount: amt, budget: amt * 1.5, flag: false, trend: 0, transactions: [`${form.name} $${amt.toFixed(2)}`] }];
      localStorage.setItem(`spending_${key}`, JSON.stringify(updated));
    }

    const newTx: Transaction = {
      name: form.name,
      category: isIncome ? "Income" : form.category,
      date: today,
      amount: `${isIncome ? "+" : "-"}$${amt.toFixed(2)}`,
      income: isIncome,
      flag: false,
      flagNote: "",
    };
    setTransactions((prev) => [newTx, ...prev]);
    setForm({ name: "", category: "Food", amount: "" });
    setShowModal(false);
  };

  const toggleStep = (i: number) => {
    const updated = nextSteps.map((s, idx) => idx === i ? { ...s, done: !s.done } : s);
    setNextSteps(updated);
    localStorage.setItem("scholar_next_steps", JSON.stringify(updated));
  };

  const isFreshman = profile?.year === "Freshman";
  const tuitionCovered = tuitionData.paid + tuitionData.aidApplied;
  const tuitionRemaining = Math.max(tuitionData.total - tuitionCovered, 0);
  const tuitionPct = tuitionData.total > 0 ? Math.round((tuitionCovered / tuitionData.total) * 100) : 0;
  const maxVal = Math.max(totalIncome, totalExpenses, 1);

  return (
    <div className="max-w-6xl mx-auto">

      {/* Log Expense Modal */}
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">Expense Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery run"
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
                  {(modalType === "income"
                    ? ["Scholarship", "Internship", "Part-time Job", "Other Income"]
                    : categories
                  ).map((c) => <option key={c}>{c}</option>)}
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

      {/* Header + Search */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#004F9F" }}>
            Welcome back{profile?.name ? `, ${profile.name}` : ""}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {profile
              ? `${profile.year} · ${profile.major} · ${profile.careerInterest}`
              : "Complete your profile to get started"}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 w-56"
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Net Balance */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Net Balance</p>
            {totalIncome - totalExpenses >= 0 && totalIncome > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: "#FFB81C", color: "#004F9F" }}>
                Positive
              </span>
            )}
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: totalIncome - totalExpenses >= 0 ? "#004F9F" : "#dc2626" }}>
            {totalIncome === 0 && totalExpenses === 0 ? "—" : `${totalIncome - totalExpenses >= 0 ? "+" : ""}$${Math.abs(totalIncome - totalExpenses).toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-400">Income minus expenses</p>
        </div>

        {/* Tuition — progress bar */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Tuition Remaining</p>
          <p className="text-2xl font-bold mb-2" style={{ color: "#004F9F" }}>
            {tuitionData.total > 0 ? `$${tuitionRemaining.toLocaleString()}` : "—"}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
            <div className="h-2 rounded-full" style={{ width: `${tuitionPct}%`, backgroundColor: "#004F9F" }} />
          </div>
          <p className="text-xs text-gray-400">{tuitionData.total > 0 ? `${tuitionPct}% covered` : "Set up in Finance"}</p>
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Total Income</p>
          <p className="text-2xl font-bold mb-1" style={{ color: "#004F9F" }}>
            {totalIncome > 0 ? `$${totalIncome.toLocaleString()}` : "—"}
          </p>
          <p className="text-xs text-gray-400">{totalIncome > 0 ? "Logged this period" : "No income logged yet"}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => openModal("expense")}
              className="text-xs font-semibold px-2 py-1 rounded border transition-colors hover:bg-gray-50"
              style={{ color: "#004F9F", borderColor: "#004F9F" }}
            >
              Log Expense
            </button>
            <button
              onClick={() => openModal("income")}
              className="text-xs font-semibold px-2 py-1 rounded border transition-colors hover:bg-gray-50"
              style={{ color: "#059669", borderColor: "#059669" }}
            >
              Log Income
            </button>
          </div>
        </div>

        {/* Loan Payoff */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Est. Loan Payoff</p>
          <p className="text-2xl font-bold mb-1" style={{ color: "#004F9F" }}>2.5 yrs</p>
          <p className="text-xs text-gray-400">Software Engineer path</p>
          <Link href="/finance" className="mt-2 inline-block text-xs font-semibold px-2 py-1 rounded border transition-colors hover:bg-gray-50" style={{ color: "#004F9F", borderColor: "#004F9F" }}>
            View Simulator
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Income vs Expenses chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-base mb-4" style={{ color: "#004F9F" }}>
              Income vs. Expenses
            </h2>
            {totalIncome === 0 && totalExpenses === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <p className="text-2xl">📈</p>
                <p className="text-sm font-medium text-gray-500">No data yet</p>
                <p className="text-xs text-gray-400">Log income or expenses in Finance to see your chart.</p>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-6 px-4">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end" style={{ height: `${CHART_HEIGHT}px` }}>
                      <div
                        className="w-full rounded-sm"
                        style={{ height: `${Math.max((totalIncome / maxVal) * CHART_HEIGHT, 4)}px`, backgroundColor: "#004F9F" }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Income</p>
                    <p className="text-xs font-semibold" style={{ color: "#004F9F" }}>${totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end" style={{ height: `${CHART_HEIGHT}px` }}>
                      <div
                        className="w-full rounded-sm"
                        style={{ height: `${Math.max((totalExpenses / maxVal) * CHART_HEIGHT, 4)}px`, backgroundColor: "#FFB81C" }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Expenses</p>
                    <p className="text-xs font-semibold" style={{ color: "#FFB81C" }}>${totalExpenses.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center mt-4">
                  <span className={`text-sm font-semibold ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-500"}`}>
                    Net: {totalIncome - totalExpenses >= 0 ? "+" : ""}${(totalIncome - totalExpenses).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>
                Recent Transactions
              </h2>
              <Link href="/finance" className="text-xs font-medium" style={{ color: "#FFB81C" }}>
                View all
              </Link>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 flex-wrap mb-4">
              {filterChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setTxFilter(chip)}
                  className="text-xs px-3 py-1 rounded-lg border font-medium transition-colors"
                  style={
                    txFilter === chip
                      ? { backgroundColor: "#004F9F", color: "#fff", borderColor: "#004F9F" }
                      : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }
                  }
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              {filteredTx.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No transactions found.</p>
              )}
              {filteredTx.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tx.name}</p>
                    <p className="text-xs text-gray-400">{tx.category} · {tx.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: tx.income ? "#004F9F" : tx.flag ? "#dc2626" : "#374151" }}
                    >
                      {tx.amount}
                    </span>
                    {tx.flag && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-lg font-medium text-white cursor-default"
                        style={{ backgroundColor: "#dc2626" }}
                        title={tx.flagNote}
                      >
                        High
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Next Steps — only for Freshman or missing profile */}
          {(isFreshman || !profile) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-base mb-4" style={{ color: "#004F9F" }}>
                Getting Started
              </h2>
              <div className="flex flex-col gap-3">
                {nextSteps.map((step, i) => (
                  <button key={i} onClick={() => toggleStep(i)} className="flex items-start gap-3 text-left w-full">
                    <div
                      className="w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center"
                      style={step.done ? { backgroundColor: "#004F9F", borderColor: "#004F9F" } : { borderColor: "#d1d5db" }}
                    >
                      {step.done && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm ${step.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {step.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>
                Upcoming Deadlines
              </h2>
              <Link href="/opportunities" className="text-xs font-medium" style={{ color: "#FFB81C" }}>
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {opportunities.map((opp, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 leading-snug">{opp.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: opp.urgent ? "#dc2626" : "#9ca3af" }}>
                        Due {opp.deadline}
                      </p>
                    </div>
                    <span className="text-sm font-bold ml-3 shrink-0" style={{ color: "#FFB81C" }}>
                      {opp.amount}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/opportunities" className="text-xs font-semibold px-3 py-1 rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#004F9F" }}>
                      Start Application
                    </Link>
                    <button
                      className="text-xs font-semibold px-3 py-1 rounded-lg border transition-colors hover:bg-gray-50"
                      style={{ color: "#004F9F", borderColor: "#004F9F" }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Coach CTA — fixed contrast */}
          <Link
            href="/voice"
            className="rounded-lg p-6 flex flex-col gap-2 hover:opacity-95 transition-opacity"
            style={{ backgroundColor: "#004F9F" }}
          >
            <h2 className="font-bold text-base text-white">AI Career Coach</h2>
            <p className="text-xs text-white/70">
              Ask about your career path, finances, or next steps.
            </p>
            <span
              className="text-xs font-bold mt-2 self-start px-3 py-1 rounded-lg"
              style={{ backgroundColor: "#FFB81C", color: "#003a75" }}
            >
              Launch Coach
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
