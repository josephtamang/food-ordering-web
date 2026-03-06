"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import {
  FiShoppingCart,
  FiStar,
  FiClock,
  FiSmartphone,
  FiCheckCircle,
  FiArrowRight,
  FiBell,
  FiZap,
  FiShield,
  FiMessageSquare,
} from "react-icons/fi";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (loading) return;
    if (user) {
      if (user.role === "admin" || user.role === "staff") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  // Show spinner while auth check is in progress
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c47a5a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-5 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/images/logo.png"
              alt="Foody"
              width={34}
              height={34}
              className="rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-xl font-bold text-[#c47a5a]">Foody</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-[#c47a5a] transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#c47a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b56a4a] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fdf6f2] to-white pt-16 pb-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#c47a5a]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-[#c47a5a]/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c47a5a]/10 px-3 py-1 text-xs font-semibold text-[#c47a5a] mb-6">
            <FiZap size={11} />
            Restaurant Ordering Made Easy
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight max-w-3xl">
            Order Great Food,{" "}
            <span className="text-[#c47a5a]">Delivered Fresh</span> to Your Table
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-500 max-w-xl leading-relaxed">
            Foody brings the full restaurant experience online — browse the menu,
            place orders, track status in real time, and enjoy every meal.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[#c47a5a] px-6 py-3 text-base font-semibold text-white hover:bg-[#b56a4a] transition-colors shadow-lg shadow-[#c47a5a]/25"
            >
              Start Ordering <FiArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-base font-semibold text-gray-700 hover:border-[#c47a5a] hover:text-[#c47a5a] transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Stats Row */}
          <div className="mt-14 grid grid-cols-3 gap-8 sm:gap-16">
            {[
              { value: "500+", label: "Happy Customers" },
              { value: "50+", label: "Menu Items" },
              { value: "4.9", label: "Avg Rating" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#c47a5a]">{s.value}</p>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need, <span className="text-[#c47a5a]">All in One Place</span>
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              From browsing the menu to leaving a review — Foody handles the entire dining journey.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FiShoppingCart,
                title: "Easy Online Ordering",
                body: "Browse categories, add to cart, and place your order in seconds — right from your phone or browser.",
                color: "bg-orange-100 text-orange-600",
              },
              {
                icon: FiClock,
                title: "Real-Time Order Tracking",
                body: "Watch your order move from 'Pending' to 'Served' live. No more wondering where your food is.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: FiStar,
                title: "Verified Reviews",
                body: "Only customers who actually ordered can leave reviews — keeping ratings honest and trustworthy.",
                color: "bg-yellow-100 text-yellow-600",
              },
              {
                icon: FiBell,
                title: "Live Announcements",
                body: "Stay in the loop with daily specials, happy hours, events, and restaurant news posted in real time.",
                color: "bg-green-100 text-green-600",
              },
              {
                icon: FiSmartphone,
                title: "Works on Every Device",
                body: "A fully responsive design that looks great on mobile, tablet, and desktop — no app download needed.",
                color: "bg-purple-100 text-purple-600",
              },
              {
                icon: FiShield,
                title: "Secure & Private",
                body: "Your data is protected with JWT authentication, hashed passwords, and role-based access control.",
                color: "bg-red-100 text-red-600",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-gray-100 p-6 hover:border-[#c47a5a]/30 hover:shadow-md transition-all"
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fdf6f2]">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Get Your Food in <span className="text-[#c47a5a]">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Browse the Menu",
                body: "Explore our full menu by category. Filter by veg/non-veg, search items, or check today's specials and hot deals.",
              },
              {
                step: "02",
                title: "Place Your Order",
                body: "Add items to your cart, enter your table number, add any special notes, and confirm your order instantly.",
              },
              {
                step: "03",
                title: "Enjoy & Review",
                body: "Track your order in real time. Once served, settle the bill and leave an honest review for what you loved.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center p-6">
                {i < 2 && (
                  <div className="hidden sm:block absolute top-10 right-0 translate-x-1/2 text-gray-300">
                    <FiArrowRight size={22} />
                  </div>
                )}
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c47a5a] text-white text-xl font-extrabold shadow-lg shadow-[#c47a5a]/25">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roles Section ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Built for Everyone</h2>
            <p className="mt-3 text-gray-500">Different experiences for customers, staff, and admins.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                role: "Customers",
                color: "border-[#c47a5a] bg-[#c47a5a]",
                light: "bg-[#fdf6f2]",
                features: [
                  "Browse & search the full menu",
                  "Add to cart & place orders",
                  "Track order status live",
                  "Request bill or call waiter",
                  "Leave verified reviews",
                  "View announcements & offers",
                ],
              },
              {
                role: "Staff",
                color: "border-blue-500 bg-blue-500",
                light: "bg-blue-50",
                features: [
                  "View and manage all orders",
                  "Update order status",
                  "Manage products & categories",
                  "Post announcements",
                  "Handle billing requests",
                ],
              },
              {
                role: "Admins",
                color: "border-purple-500 bg-purple-500",
                light: "bg-purple-50",
                features: [
                  "Full dashboard with analytics",
                  "Manage users, orders, products",
                  "Set discounts & promotions",
                  "Moderate reviews",
                  "View revenue & growth stats",
                  "Complete billing control",
                ],
              },
            ].map((r) => (
              <div
                key={r.role}
                className={`rounded-2xl border-2 ${r.color.split(" ")[0]} p-6 ${r.light}`}
              >
                <div className={`inline-flex items-center justify-center rounded-xl px-3 py-1 text-sm font-bold text-white mb-4 ${r.color.split(" ")[1]}`}>
                  {r.role}
                </div>
                <ul className="space-y-2">
                  {r.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <FiCheckCircle size={15} className="mt-0.5 shrink-0 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fdf6f2]">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              What Our <span className="text-[#c47a5a]">Customers Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                name: "Priya S.",
                rating: 5,
                text: "Ordering is so smooth! I love that I can track exactly when my food is being prepared. The interface is clean and easy to use.",
              },
              {
                name: "Rahul M.",
                rating: 5,
                text: "The daily specials section is amazing — I always find something new to try. The BOGO deals on weekends are a great bonus!",
              },
              {
                name: "Anita K.",
                rating: 5,
                text: "I appreciate that only people who actually ordered can leave reviews. It makes the ratings much more trustworthy.",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <FiStar key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#c47a5a]/20 flex items-center justify-center text-[#c47a5a] font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#c47a5a]">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <FiMessageSquare size={36} className="mx-auto mb-4 text-white/70" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Ready to Experience Foody?
          </h2>
          <p className="mt-4 text-white/80 text-base sm:text-lg max-w-xl mx-auto">
            Join hundreds of customers enjoying a seamless restaurant ordering experience.
            Sign up free and place your first order in minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-[#c47a5a] hover:bg-gray-50 transition-colors shadow-lg"
            >
              Create Free Account <FiArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-8 bg-gray-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image
            src="/assets/images/logo.png"
            alt="Foody"
            width={24}
            height={24}
            className="rounded-md opacity-80"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-sm font-bold text-white">Foody</span>
        </div>
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Foody Restaurant. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
