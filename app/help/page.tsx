"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    question: "How do I connect my bank account?",
    answer: "Go to Settings → Connections and click 'Connect Bank'. ScholarSync uses Plaid, a secure bank-linking service. Your credentials are never stored — only transaction summaries are pulled.",
  },
  {
    question: "How do I sync my Aggie Access portal?",
    answer: "Go to Settings → Connections and click 'Connect Portal'. You'll authenticate with your NCAT Microsoft credentials. ScholarSync will pull your schedule, transcript, and tuition balance.",
  },
  {
    question: "Where does the salary data come from?",
    answer: "Salary data on the Career page is sourced from levels.fyi and updated nightly. It reflects real reported compensation for entry-level and new grad roles at each company.",
  },
  {
    question: "How does the AI Coach work?",
    answer: "The AI Coach uses OpenAI's GPT-4o model combined with your profile, financial data, and academic info to give personalized advice. You can talk to it by voice or text on the AI Coach page.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. Bank tokens are encrypted at rest. School portal tokens are never logged. All data is stored in Supabase with row-level security, meaning only your account can access your records.",
  },
  {
    question: "How do I update my profile or career interest?",
    answer: "Go to Settings → Profile. You can update your name, major, year, and career interest at any time. Changes are saved immediately and will update your recommendations.",
  },
  {
    question: "Can I use ScholarSync if I'm not at NCAT?",
    answer: "The school portal integration is built for NCAT's Aggie Access system. Other features — finance tracking, AI coaching, opportunities, and career planning — work for any student.",
  },
  {
    question: "How do I switch between light and dark mode?",
    answer: "Go to Settings → Account → Appearance and toggle dark mode on or off. Your preference is saved automatically.",
  },
];

const guides = [
  { title: "Getting Started",        description: "Set up your profile and connect your accounts in 3 minutes.",   href: "/onboarding" },
  { title: "Using the AI Coach",     description: "Learn how to get the most out of voice and text coaching.",      href: "/voice"      },
  { title: "Finding Opportunities",  description: "Filter and save scholarships, fellowships, and hackathons.",    href: "/opportunities" },
  { title: "Reading Your Finances",  description: "Understand your tuition gap, spending flags, and debt outlook.", href: "/finance"    },
];

export default function Help() {
  const [open, setOpen]   = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm]   = useState({ subject: "", message: "" });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ subject: "", message: "" });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <span style={{ color: "#004F9F" }}>Help & Support</span>
      </nav>

      <h1 className="text-2xl font-bold mb-1" style={{ color: "#004F9F" }}>Help & Support</h1>
      <p className="text-sm text-gray-500 mb-8">Find answers, guides, and ways to get in touch.</p>

      {/* Quick guides */}
      <section className="mb-10">
        <h2 className="font-semibold text-base mb-4" style={{ color: "#004F9F" }}>Quick Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {guides.map((g) => (
            <Link
              key={g.title}
              href={g.href}
              className="block bg-white border border-gray-100 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <p className="font-semibold text-sm mb-1" style={{ color: "#004F9F" }}>{g.title}</p>
              <p className="text-xs text-gray-500">{g.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="mb-10">
        <h2 className="font-semibold text-base mb-4" style={{ color: "#004F9F" }}>Frequently Asked Questions</h2>
        <div className="flex flex-col gap-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-gray-800">{faq.question}</span>
                <span
                  className="text-lg font-light shrink-0 ml-4 transition-transform"
                  style={{
                    color: "#004F9F",
                    transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                    display: "inline-block",
                    transition: "transform 0.2s ease",
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                  <div className="pt-3">{faq.answer}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section>
        <h2 className="font-semibold text-base mb-1" style={{ color: "#004F9F" }}>Contact Support</h2>
        <p className="text-sm text-gray-500 mb-4">Can&apos;t find an answer? Send us a message.</p>

        {submitted ? (
          <div className="bg-green-50 border border-green-100 rounded-lg px-5 py-4">
            <p className="text-sm font-semibold text-green-700">Message sent!</p>
            <p className="text-xs text-green-600 mt-0.5">We&apos;ll get back to you within 24 hours.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs font-semibold mt-3 underline text-green-700"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
              <input
                type="text"
                required
                placeholder="e.g. Issue with bank connection"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Message</label>
              <textarea
                required
                rows={4}
                placeholder="Describe your issue or question..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 resize-none"
              />
            </div>
            <button
              type="submit"
              className="self-start px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#004F9F" }}
            >
              Send Message
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
