"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Onboarding() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    major: "",
    year: "",
    careerInterest: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    const { name, major, year, careerInterest } = form;
    localStorage.setItem("scholar_profile", JSON.stringify({ name, major, year, careerInterest }));
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#004F9F" }}>
          Let&apos;s set up your profile
        </h1>
        <p className="text-gray-500 mb-8">
          This helps ScholarSync personalize your career and financial recommendations.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#004F9F" }}>
              Full Name
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Jordan Smith"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#004F9F" }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@email.com"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#004F9F" }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#004F9F" }}>
              Major
            </label>
            <input
              name="major"
              type="text"
              required
              placeholder="e.g. Computer Science"
              value={form.major}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#004F9F" }}>
              Year in School
            </label>
            <select
              name="year"
              required
              value={form.year}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
            >
              <option value="">Select your year</option>
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#004F9F" }}>
              Career Interest
            </label>
            <select
              name="careerInterest"
              required
              value={form.careerInterest}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
            >
              <option value="">Select a career path</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
              <option value="Cloud Engineer">Cloud Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="AI / ML Engineer">AI / ML Engineer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-4 rounded-lg text-lg hover:opacity-90 transition-opacity mt-2 disabled:opacity-60"
            style={{ backgroundColor: "#FFB81C" }}
          >
            {loading ? "Creating account..." : "Continue to Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}
