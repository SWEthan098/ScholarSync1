import Link from "next/link";

const features = [
  {
    title: "Financial Dashboard",
    description: "Connect your bank to track spending, monitor tuition, and project debt payoff timelines.",
  },
  {
    title: "Career Explorer",
    description: "Browse internships with real salary data from levels.fyi. Know what companies pay before you apply.",
  },
  {
    title: "Academic Advisor",
    description: "Sync with Aggie Access to view your transcript, schedule, and get AI-driven course drop analysis.",
  },
  {
    title: "Opportunity Engine",
    description: "Scholarships, fellowships, and hackathons surfaced automatically and sorted by deadline.",
  },
  {
    title: "AI Career Coach",
    description: "Ask anything by text or voice. Your coach knows your grades, finances, and career goals.",
  },
  {
    title: "Financial Simulator",
    description: "Compare career paths side by side — salary growth, loan payoff, and savings potential.",
  },
];

const stats = [
  { value: "$10K+", label: "Avg. scholarships found per student" },
  { value: "500+", label: "Internship listings updated weekly" },
  { value: "3 min", label: "To set up and get matched" },
];

const flowSteps = [
  { step: "1", label: "Create Profile", sub: "Major, year, career interest" },
  { step: "2", label: "Connect Accounts", sub: "Bank + Aggie Access portal" },
  { step: "3", label: "Get Your Dashboard", sub: "Finance, career, academics" },
  { step: "4", label: "Ask Your AI Coach", sub: "Voice or text guidance" },
];

export default function Home() {
  return (
    <div className="bg-white min-h-screen">

      {/* Nav */}
      <header className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight" style={{ color: "#004F9F" }}>
            Scholar<span style={{ color: "#FFB81C" }}>Sync</span>
          </span>
          <Link
            href="/onboarding"
            className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#004F9F" }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-16 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#FFB81C" }}>
          NC A&T State University × Bank of America
        </p>
        <h1 className="text-6xl font-bold tracking-tight leading-tight mb-5" style={{ color: "#004F9F" }}>
          Scholar<span style={{ color: "#FFB81C" }}>Sync</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-3 leading-relaxed">
          The AI-powered career and financial platform built for college students pursuing technology careers.
        </p>
        <p className="text-gray-400 max-w-xl mx-auto mb-10 text-base">
          One platform to manage your finances, discover opportunities, plan your career, and get personalized AI guidance — backed by real data.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="text-white font-semibold px-8 py-3 rounded-lg text-base transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#004F9F" }}
          >
            Create Your Profile
          </Link>
          <Link
            href="/dashboard"
            className="font-semibold px-8 py-3 rounded-lg text-base border transition-colors hover:bg-gray-50"
            style={{ color: "#004F9F", borderColor: "#004F9F" }}
          >
            View Demo
          </Link>
        </div>
      </section>

      {/* User Flow Diagram */}
      <section className="border-y border-gray-100 bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-10 text-gray-400">
            How it works
          </p>
          <div className="flex items-start justify-between gap-4 relative">
            {/* Connector line */}
            <div className="absolute top-6 left-0 right-0 h-px bg-gray-200 z-0" style={{ left: "8%", right: "8%" }} />

            {flowSteps.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center flex-1 relative z-10">
                {/* Circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base mb-3 border-4 border-gray-50"
                  style={{ backgroundColor: i === flowSteps.length - 1 ? "#FFB81C" : "#004F9F" }}
                >
                  {s.step}
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#004F9F" }}>{s.label}</p>
                <p className="text-xs text-gray-400 leading-snug max-w-[120px]">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Feature preview boxes below the flow */}
          <div className="grid grid-cols-4 gap-3 mt-10">
            {[
              { label: "Finance", detail: "Spending · Tuition · Debt" },
              { label: "Career", detail: "Internships · Salary · Roadmap" },
              { label: "Academics", detail: "Schedule · GPA · Drop Advisor" },
              { label: "AI Coach", detail: "Voice · Chat · Personalized" },
            ].map((box) => (
              <div
                key={box.label}
                className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm"
              >
                <p className="font-semibold text-sm mb-1" style={{ color: "#004F9F" }}>{box.label}</p>
                <p className="text-xs text-gray-400">{box.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-8 grid grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold mb-1" style={{ color: "#004F9F" }}>{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#004F9F" }}>
            Everything you need in one place
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            ScholarSync connects your bank, school portal, and real-time career data into a single intelligent system.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="border border-gray-100 rounded-lg p-6 hover:shadow-sm transition-shadow bg-white"
            >
              <div className="w-8 h-1 rounded-sm mb-4" style={{ backgroundColor: "#FFB81C" }} />
              <h3 className="font-semibold text-base mb-2" style={{ color: "#004F9F" }}>{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-20 text-center text-white" style={{ backgroundColor: "#004F9F" }}>
        <h2 className="text-3xl font-bold mb-3">Ready to take control of your future?</h2>
        <p className="text-white/70 mb-8 max-w-md mx-auto">
          Set up your profile in under three minutes and start getting personalized recommendations today.
        </p>
        <Link
          href="/onboarding"
          className="inline-block font-semibold px-8 py-3 rounded-lg text-base transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#FFB81C", color: "#004F9F" }}
        >
          Get Started for Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        ScholarSync &copy; 2026 · NC A&T State University · Bank of America Financial Wellness Hackathon
      </footer>
    </div>
  );
}
