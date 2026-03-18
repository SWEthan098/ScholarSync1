import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Scholar<span style={{ color: "#E31837" }}>Sync</span>
        </h1>
        <p className="text-xl mb-3" style={{ color: "#012169" }}>
          Your AI-powered career and financial advisor for college students in tech.
        </p>
        <p className="mb-10 text-gray-600">
          Discover scholarships, plan your career path, track your finances, and get
          personalized guidance — all in one place.
        </p>
        <Link
          href="/onboarding"
          style={{ backgroundColor: "#E31837" }}
          className="inline-block hover:opacity-90 text-white font-semibold px-8 py-4 rounded-full text-lg transition-opacity"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
