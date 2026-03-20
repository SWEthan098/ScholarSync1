"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

function useAnimatedValue(target: number, duration = 600) {
  const [displayed, setDisplayed] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    const start = prevRef.current;
    if (start === target) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
      else prevRef.current = target;
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return displayed;
}

const INITIAL_TUITION = { total: 0, paid: 0, aidApplied: 0 };

const MOCK_SPENDING: { category: string; amount: number; budget: number; flag: boolean; trend: number; transactions: string[] }[] = [];

const MOCK_INCOME: { category: string; amount: number; transactions: string[] }[] = [];

const projections = [
  { career: "Software Engineer", salary: 105000, payoff: "1.5 years" },
  { career: "Cybersecurity Analyst", salary: 92000, payoff: "2 years" },
  { career: "Data Scientist", salary: 80000, payoff: "3 years" },
];

interface ManualEntry { name: string; category: string; amount: string; }
interface IncomeEntry { category: string; amount: number; transactions: string[]; }

const expenseCategories = ["Food & Dining", "Transportation", "Entertainment", "Books & Supplies", "Subscriptions", "Other"];
const incomeCategories = ["Scholarship", "Internship", "Part-time Job", "Other Income"];
const dateRanges = ["This Month", "Last Month", "This Semester", "This Year"];

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const donutColors = ["#004F9F", "#FFB81C", "#ef4444", "#10b981", "#8b5cf6", "#f97316", "#ec4899", "#06b6d4"];
const incomeColors = ["#16a34a", "#a855f7", "#f59e0b", "#0ea5e9"];

function DonutChart({ data, total, colors }: { data: { category: string; amount: number }[]; total: number; colors: string[] }) {
  let offset = 0;
  const slices = data.map((item, i) => {
    const pct = total > 0 ? item.amount / total : 0;
    const dash = pct * CIRCUMFERENCE;
    const slice = { offset, dash, color: colors[i % colors.length] };
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
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease" }}
        />
      ))}
      <text x="50" y="54" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#004F9F">
        ${total}
      </text>
    </svg>
  );
}

export default function Finance() {
  const { user } = useAuth();
  const [spending, setSpending] = useState(MOCK_SPENDING);
  const [income, setIncome] = useState<IncomeEntry[]>(MOCK_INCOME);
  const [tuition, setTuition] = useState(INITIAL_TUITION);
  const [showTuitionModal, setShowTuitionModal] = useState(false);
  const [tuitionForm, setTuitionForm] = useState({ type: "payment", amount: "" });
  const [showTuitionSetup, setShowTuitionSetup] = useState(false);
  const [tuitionTotalInput, setTuitionTotalInput] = useState("");

  const totalSpend = spending.reduce((s, i) => s + i.amount, 0);
  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const remaining = tuition.total - tuition.paid - tuition.aidApplied;
  const paidPct = tuition.total > 0 ? Math.min(100, Math.round(((tuition.paid + tuition.aidApplied) / tuition.total) * 100)) : 0;
  const animatedPaid = useAnimatedValue(tuition.paid);
  const animatedAid = useAnimatedValue(tuition.aidApplied);
  const animatedRemaining = useAnimatedValue(Math.max(0, remaining));
  const animatedPct = useAnimatedValue(paidPct);

  // Load persisted data from localStorage once user is known
  useEffect(() => {
    const key = user?.id ?? "demo";
    const savedSpending = localStorage.getItem(`spending_${key}`);
    const savedIncome = localStorage.getItem(`income_${key}`);
    const savedTuition = localStorage.getItem(`tuition_${key}`);
    if (savedSpending) setSpending(JSON.parse(savedSpending));
    if (savedIncome) setIncome(JSON.parse(savedIncome));
    if (savedTuition) setTuition(JSON.parse(savedTuition));
    const savedRecurring = localStorage.getItem(`recurring_${key}`);
    if (savedRecurring) setRecurring(JSON.parse(savedRecurring));
  }, [user?.id]);

  // Sync real bank data if available
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const userId = user?.id ?? process.env.NEXT_PUBLIC_DEMO_USER_ID;
    if (!API || !userId) return;
    fetch(`${API}/bank/finance/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.spending) && data.spending.length > 0) setSpending(data.spending);
        if (Array.isArray(data?.income) && data.income.length > 0) setIncome(data.income);
      })
      .catch(() => {});
  }, [user?.id]);

  const [dateRange, setDateRange] = useState("This Month");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedIncome, setExpandedIncome] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editBudgets, setEditBudgets] = useState(false);
  const [budgets, setBudgets] = useState<Record<string, number>>(
    Object.fromEntries(spending.map((s) => [s.category, s.budget]))
  );
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"expense" | "income">("expense");
  const [form, setForm] = useState<ManualEntry>({ name: "", category: "Food & Dining", amount: "" });
  const [recurring, setRecurring] = useState<{ id: string; name: string; amount: number; frequency: string; category: string }[]>([]);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringForm, setRecurringForm] = useState({ name: "", amount: "", frequency: "Monthly", category: "Subscriptions" });

  const openModal = (type: "expense" | "income") => {
    setModalType(type);
    setForm({ name: "", category: type === "income" ? "Scholarship" : "Food & Dining", amount: "" });
    setShowModal(true);
  };

  const handleLogTransaction = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt) return;
    const key = user?.id ?? "demo";

    if (modalType === "expense") {
      setSpending((prev) => {
        const existing = prev.find((s) => s.category === form.category);
        const updated = existing
          ? prev.map((s) => s.category === form.category
              ? { ...s, amount: s.amount + amt, transactions: [`${form.name} $${amt.toFixed(2)}`, ...s.transactions], flag: s.amount + amt > s.budget }
              : s)
          : [...prev, { category: form.category, amount: amt, budget: amt * 1.5, flag: false, trend: 0, transactions: [`${form.name} $${amt.toFixed(2)}`] }];
        localStorage.setItem(`spending_${key}`, JSON.stringify(updated));
        return updated;
      });
    } else {
      setIncome((prev) => {
        const existing = prev.find((i) => i.category === form.category);
        const updated = existing
          ? prev.map((i) => i.category === form.category
              ? { ...i, amount: i.amount + amt, transactions: [`${form.name} $${amt.toFixed(2)}`, ...i.transactions] }
              : i)
          : [...prev, { category: form.category, amount: amt, transactions: [`${form.name} $${amt.toFixed(2)}`] }];
        localStorage.setItem(`income_${key}`, JSON.stringify(updated));
        return updated;
      });
    }

    setShowModal(false);
    setForm({ name: "", category: "Food & Dining", amount: "" });
  };

  const handleSetTuitionTotal = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = parseFloat(tuitionTotalInput);
    if (!amt) return;
    const key = user?.id ?? "demo";
    setTuition((prev) => {
      const updated = { ...prev, total: amt };
      localStorage.setItem(`tuition_${key}`, JSON.stringify(updated));
      return updated;
    });
    setTuitionTotalInput("");
    setShowTuitionSetup(false);
  };

  const handleTuitionPayment = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = parseFloat(tuitionForm.amount);
    if (!amt) return;
    const key = user?.id ?? "demo";
    setTuition((prev) => {
      const updated = {
        ...prev,
        paid: tuitionForm.type === "payment" ? prev.paid + amt : prev.paid,
        aidApplied: tuitionForm.type === "aid" ? prev.aidApplied + amt : prev.aidApplied,
      };
      localStorage.setItem(`tuition_${key}`, JSON.stringify(updated));
      return updated;
    });
    setTuitionForm({ type: "payment", amount: "" });
    setShowTuitionModal(false);
  };

  const filteredSpending = spending.filter((s) =>
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddRecurring = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = parseFloat(recurringForm.amount);
    if (!amt || !recurringForm.name) return;
    const key = user?.id ?? "demo";
    const newEntry = { id: Math.random().toString(36).slice(2, 9), name: recurringForm.name, amount: amt, frequency: recurringForm.frequency, category: recurringForm.category };
    setRecurring((prev) => {
      const updated = [...prev, newEntry];
      localStorage.setItem(`recurring_${key}`, JSON.stringify(updated));
      return updated;
    });
    setRecurringForm({ name: "", amount: "", frequency: "Monthly", category: "Subscriptions" });
    setShowRecurringForm(false);
  };

  const handleDeleteRecurring = (id: string) => {
    const key = user?.id ?? "demo";
    setRecurring((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(`recurring_${key}`, JSON.stringify(updated));
      return updated;
    });
  };

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

      {/* Log Expense/Income Modal */}
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
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#004F9F" }}>
                  {modalType === "income" ? "Add Income" : "Add Expense"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-gray-50" style={{ color: "#004F9F", borderColor: "#004F9F" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tuition Payment Modal */}
      {showTuitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "#004F9F" }}>{tuitionForm.type === "aid" ? "Apply Aid / Scholarship" : "Log Tuition Payment"}</h2>
              <button onClick={() => setShowTuitionModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleTuitionPayment} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                <select
                  value={tuitionForm.type}
                  onChange={(e) => setTuitionForm({ ...tuitionForm, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                >
                  <option value="payment">Tuition Payment</option>
                  <option value="aid">Aid / Scholarship Applied</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={tuitionForm.amount}
                  onChange={(e) => setTuitionForm({ ...tuitionForm, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "#004F9F" }}>
                  Confirm
                </button>
                <button type="button" onClick={() => setShowTuitionModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold border" style={{ color: "#004F9F", borderColor: "#004F9F" }}>
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
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none">
            {dateRanges.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button onClick={() => openModal("expense")} className="text-sm font-semibold px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50" style={{ color: "#004F9F", borderColor: "#004F9F" }}>
            Log Expense
          </button>
          <button onClick={() => openModal("income")} className="text-sm font-semibold px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50" style={{ color: "#059669", borderColor: "#059669" }}>
            Log Income
          </button>
          <button onClick={handleExportCSV} className="text-sm font-semibold px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50" style={{ color: "#004F9F", borderColor: "#004F9F" }}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Tuition */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>Tuition Summary</h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setTuitionTotalInput(tuition.total > 0 ? String(tuition.total) : ""); setShowTuitionSetup(true); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50"
              style={{ color: "#6b7280", borderColor: "#d1d5db" }}
            >
              {tuition.total > 0 ? "Edit Total" : "Set Total"}
            </button>
            {tuition.total > 0 && (
              <>
                <button
                  onClick={() => { setTuitionForm({ type: "aid", amount: "" }); setShowTuitionModal(true); }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                  style={{ color: "#059669", borderColor: "#059669" }}
                >
                  Apply Aid
                </button>
                <button
                  onClick={() => { setTuitionForm({ type: "payment", amount: "" }); setShowTuitionModal(true); }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                  style={{ color: "#004F9F", borderColor: "#004F9F" }}
                >
                  Log Payment
                </button>
              </>
            )}
          </div>
        </div>

        {tuition.total === 0 ? (
          showTuitionSetup ? (
            <form onSubmit={handleSetTuitionTotal} className="flex flex-col gap-3">
              <p className="text-sm text-gray-500">Enter your total tuition balance for this semester or year.</p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Total Tuition ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="e.g. 12000"
                    value={tuitionTotalInput}
                    onChange={(e) => setTuitionTotalInput(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    autoFocus
                  />
                </div>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white shrink-0" style={{ backgroundColor: "#004F9F" }}>
                  Save
                </button>
                <button type="button" onClick={() => setShowTuitionSetup(false)} className="px-4 py-2.5 rounded-lg text-sm font-semibold border shrink-0" style={{ color: "#004F9F", borderColor: "#004F9F" }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <p className="text-3xl">🎓</p>
              <p className="text-sm font-medium text-gray-500">No tuition set up yet</p>
              <p className="text-xs text-gray-400 mb-2">Click <strong>Set Total</strong> to enter your tuition balance and start tracking payments.</p>
              <button
                onClick={() => setShowTuitionSetup(true)}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: "#004F9F" }}
              >
                Set Up Tuition
              </button>
            </div>
          )
        ) : (
          <>
            {showTuitionSetup && (
              <form onSubmit={handleSetTuitionTotal} className="flex gap-3 items-end mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Update Total Tuition ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={tuitionTotalInput}
                    onChange={(e) => setTuitionTotalInput(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    autoFocus
                  />
                </div>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white shrink-0" style={{ backgroundColor: "#004F9F" }}>Save</button>
                <button type="button" onClick={() => setShowTuitionSetup(false)} className="px-4 py-2.5 rounded-lg text-sm font-semibold border shrink-0" style={{ color: "#004F9F", borderColor: "#004F9F" }}>Cancel</button>
              </form>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Tuition</p>
                <p className="text-xl font-bold" style={{ color: "#004F9F" }}>${tuition.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Paid</p>
                <p className="text-xl font-bold text-green-600">${animatedPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Aid Applied</p>
                <p className="text-xl font-bold text-green-600">${animatedAid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Remaining</p>
                <p className="text-xl font-bold text-red-600">${animatedRemaining.toLocaleString()}</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
              <div className="h-2.5 rounded-full" style={{ width: `${animatedPct}%`, backgroundColor: "#004F9F", transition: "width 0.8s ease" }} />
            </div>
            <p className="text-xs text-gray-400">{animatedPct}% covered</p>
          </>
        )}
      </section>

      {/* Income */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>Income — {dateRange}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Total: ${totalIncome.toLocaleString()}</p>
          </div>
          <button onClick={() => openModal("income")} className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50" style={{ color: "#059669", borderColor: "#059669" }}>
            + Add Income
          </button>
        </div>
        {income.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <p className="text-3xl">💰</p>
            <p className="text-sm font-medium text-gray-500">No income logged yet</p>
            <p className="text-xs text-gray-400">Click <strong>+ Add Income</strong> to track your first source.</p>
          </div>
        ) : (
        <div className="flex gap-6 items-start mb-5">
          <DonutChart data={income} total={totalIncome} colors={incomeColors} />
          <div className="flex flex-col gap-2 justify-center">
            {income.map((item, i) => (
              <div key={item.category} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: incomeColors[i % incomeColors.length] }} />
                <span className="text-xs text-gray-600">{item.category}</span>
                <span className="text-xs font-semibold ml-1 text-green-600">
                  {totalIncome > 0 ? Math.round((item.amount / totalIncome) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
        )}
        <div className="flex flex-col gap-2">
          {income.map((item) => {
            const isExpanded = expandedIncome === item.category;
            return (
              <div key={item.category} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpandedIncome(isExpanded ? null : item.category)}
                >
                  <p className="text-sm font-medium text-gray-800">{item.category}</p>
                  <div className="flex items-center gap-2 ml-4">
                    <p className="text-base font-bold text-green-600">+${item.amount.toLocaleString()}</p>
                    <span className="text-gray-400 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>
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

      {/* Spending */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>Spending — {dateRange}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Total: ${totalSpend.toLocaleString()}</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none w-44"
            />
            <button
              onClick={() => openModal("expense")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50"
              style={{ color: "#004F9F", borderColor: "#004F9F" }}
            >
              + Log Expense
            </button>
            <button
              onClick={() => setEditBudgets(!editBudgets)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ color: "#6b7280", borderColor: "#d1d5db" }}
            >
              {editBudgets ? "Done" : "Edit Limits"}
            </button>
          </div>
        </div>

        {spending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <p className="text-3xl">📊</p>
            <p className="text-sm font-medium text-gray-500">No spending logged yet</p>
            <p className="text-xs text-gray-400">Use <strong>Log Transaction</strong> at the top to add your first expense.</p>
          </div>
        ) : (
        <div className="flex gap-6 items-start mb-5">
          <DonutChart data={spending} total={totalSpend} colors={donutColors} />
          <div className="flex flex-col gap-2 justify-center">
            {spending.map((item, i) => (
              <div key={item.category} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: donutColors[i % donutColors.length] }} />
                <span className="text-xs text-gray-600">{item.category}</span>
                <span className="text-xs font-semibold ml-1" style={{ color: "#004F9F" }}>
                  {totalSpend > 0 ? Math.round((item.amount / totalSpend) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
        )}

        <div className="flex flex-col gap-2">
          {filteredSpending.map((item) => {
            const overBudget = item.amount - item.budget;
            const isExpanded = expandedCategory === item.category;
            return (
              <div key={item.category} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpandedCategory(isExpanded ? null : item.category)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{item.category}</p>
                      {item.flag && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium text-white" style={{ backgroundColor: "#dc2626" }}
                          title={`You've spent $${overBudget} over your $${item.budget} budget`}>
                          High
                        </span>
                      )}
                      <span className={`text-xs font-medium ${item.trend > 0 ? "text-red-500" : item.trend < 0 ? "text-green-600" : "text-gray-400"}`}>
                        {item.trend > 0 ? `↑ ${item.trend}%` : item.trend < 0 ? `↓ ${Math.abs(item.trend)}%` : "—"} vs last month
                      </span>
                    </div>
                    {item.flag
                      ? <p className="text-xs text-red-500 mt-0.5">${overBudget} over your ${item.budget} budget</p>
                      : <p className="text-xs text-green-600 mt-0.5">On track · ${item.budget - item.amount} under budget</p>
                    }
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

      {/* Recurring Expenses */}
      <section className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-base" style={{ color: "#004F9F" }}>Recurring Expenses</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Monthly total: ${recurring.filter(r => r.frequency === "Monthly").reduce((s, r) => s + r.amount, 0).toLocaleString()} ·
              Annual total: ${recurring.reduce((s, r) => {
                if (r.frequency === "Weekly") return s + r.amount * 52;
                if (r.frequency === "Monthly") return s + r.amount * 12;
                return s + r.amount;
              }, 0).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setShowRecurringForm(!showRecurringForm)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50"
            style={{ color: "#004F9F", borderColor: "#004F9F" }}
          >
            {showRecurringForm ? "Cancel" : "+ Add Recurring"}
          </button>
        </div>

        {showRecurringForm && (
          <form onSubmit={handleAddRecurring} className="flex flex-wrap gap-3 items-end mb-5 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-32">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
              <input
                type="text" required placeholder="e.g. Netflix"
                value={recurringForm.name}
                onChange={(e) => setRecurringForm({ ...recurringForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Amount ($)</label>
              <input
                type="number" required min="0.01" step="0.01" placeholder="0.00"
                value={recurringForm.amount}
                onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Frequency</label>
              <select
                value={recurringForm.frequency}
                onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {["Weekly", "Monthly", "Annually"].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
              <select
                value={recurringForm.category}
                onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {["Subscriptions", "Rent", "Utilities", "Insurance", "Food & Dining", "Transportation", "Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0" style={{ backgroundColor: "#004F9F" }}>
              Add
            </button>
          </form>
        )}

        {recurring.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            <p className="text-sm font-medium text-gray-500">No recurring expenses yet</p>
            <p className="text-xs text-gray-400">Add subscriptions, rent, utilities, and other fixed costs.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.category} · {r.frequency}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold" style={{ color: "#004F9F" }}>${r.amount.toLocaleString()}<span className="text-xs font-normal text-gray-400">/{r.frequency === "Weekly" ? "wk" : r.frequency === "Monthly" ? "mo" : "yr"}</span></p>
                  <button onClick={() => handleDeleteRecurring(r.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
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
