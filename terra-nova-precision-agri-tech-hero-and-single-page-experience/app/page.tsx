"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight, Check, Leaf, Mail, MapPin, Phone, Sprout, Cpu, Microscope, Droplets } from "lucide-react"
import Image from "next/image"

type View = "home" | "about" | "solutions" | "blog" | "contact"

const NAV: { key: View; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "solutions", label: "Solutions" },
  { key: "blog", label: "Blog" },
  { key: "contact", label: "Contact Us" },
]

export default function Page() {
  const [view, setView] = useState<View>("home")

  return (
    <main className="min-h-screen bg-muted p-3 md:p-5">
      <section className="relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-sky-200 via-sky-100 to-sky-50 md:min-h-[calc(100vh-2.5rem)]">
        {/* Background field image */}
        <div className="absolute inset-0">
          <Image
            src="/hero-field.jpg"
            alt="Tractor spraying a vast green field at golden hour"
            fill
            priority
            className="object-cover"
          />
          {/* Readability overlay */}
          <motion.div
            initial={false}
            animate={{ opacity: view === "home" ? 1 : 1 }}
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/60"
          />
        </div>

        {/* Content */}
        <div className="relative flex flex-1 flex-col px-4 pt-5 pb-6 md:px-8 md:pt-6 md:pb-10">
          {/* Nav */}
          <motion.nav
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex max-w-7xl items-center justify-between gap-4"
          >
            <div className="flex flex-1 items-center justify-between rounded-full bg-white px-5 py-3 shadow-sm md:px-7 md:py-4">
              <button onClick={() => setView("home")} className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center">
                  <Leaf className="h-6 w-6 text-green-700" fill="currentColor" />
                </span>
                <span className="text-lg font-semibold tracking-tight">
                  <span className="text-green-700">Terra</span>
                  <span className="text-foreground">Nova</span>
                </span>
              </button>
              <ul className="hidden items-center gap-1 md:flex">
                {NAV.map((item) => {
                  const active = view === item.key
                  return (
                    <li key={item.key} className="relative">
                      <button
                        onClick={() => setView(item.key)}
                        className={`relative rounded-full px-4 py-1.5 text-sm transition-colors ${
                          active ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="nav-pill"
                            className="absolute inset-0 -z-0 rounded-full bg-green-50"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-green-700 py-3 pl-6 pr-3 text-sm font-medium text-white shadow-sm transition hover:bg-green-800 md:py-4 md:pl-7 md:pr-4"
            >
              <span>Get Started</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-green-700">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </motion.nav>

          {/* Animated views */}
          <div className="mx-auto mt-12 flex w-full max-w-7xl flex-1 flex-col justify-center md:mt-16">
            <AnimatePresence mode="wait">
              {view === "home" && <HomeView key="home" />}
              {view === "about" && <AboutView key="about" />}
              {view === "solutions" && <SolutionsView key="solutions" />}
              {view === "blog" && <BlogView key="blog" />}
              {view === "contact" && <ContactView key="contact" />}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  )
}

// Shared motion variants
const fadeUp = {
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -16, filter: "blur(8px)" },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const item = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
}

/* ------------------------------- HOME ------------------------------- */
function HomeView() {
  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.6 }}
      className="text-center"
    >
      <motion.h1
        variants={item}
        className="mx-auto max-w-4xl text-balance font-sans text-4xl font-medium leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
      >
        Cultivating Tomorrow with Precision Agri-Tech
      </motion.h1>
      <motion.p
        variants={item}
        className="mx-auto mt-6 max-w-xl text-pretty text-base font-medium leading-relaxed text-white/90 drop-shadow md:text-lg"
      >
        Data-driven farming powered by AI insights and bioengineering to grow more, with less.
      </motion.p>

      <motion.div variants={item} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-full bg-green-700 py-3 pl-7 pr-3 text-sm font-medium text-white shadow-sm transition hover:bg-green-800 md:py-4 md:pl-8 md:pr-4 md:text-base"
        >
          <span>Explore Our Solutions</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-700">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </a>
        <a
          href="#"
          className="inline-flex items-center rounded-full border border-white/50 bg-white/10 px-7 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 md:py-4 md:text-base"
        >
          Learn More
        </a>
      </motion.div>

      {/* Bottom row */}
      <motion.div variants={item} className="relative mt-32 flex items-end justify-between gap-4 md:mt-56">
        <div className="flex items-center gap-3 rounded-2xl bg-black/35 px-3 py-2 pr-5 text-white backdrop-blur-md">
          <div className="flex -space-x-3">
            <Image src="/avatar-1.jpg" alt="" width={36} height={36} className="h-9 w-9 rounded-full border-2 border-white/70 object-cover" />
            <Image src="/avatar-2.jpg" alt="" width={36} height={36} className="h-9 w-9 rounded-full border-2 border-white/70 object-cover" />
          </div>
          <p className="text-left text-xs leading-tight md:text-sm">
            Already helped
            <br />
            over 10K+ clients
          </p>
        </div>

        <ul className="hidden flex-wrap items-center justify-end gap-3 md:flex">
          {["Efficiency", "Sustainability", "Growth"].map((label) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/25 px-4 py-2 text-sm text-white backdrop-blur-md"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------- ABOUT ------------------------------ */
function AboutView() {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" exit="exit" className="grid gap-10 md:grid-cols-2 md:items-center">
      <div>
        <motion.span
          variants={item}
          className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-xs text-white backdrop-blur-md"
        >
          <Sprout className="h-3.5 w-3.5 text-green-400" /> About TerraNova
        </motion.span>
        <motion.h2
          variants={item}
          className="mt-5 text-balance font-sans text-4xl font-medium leading-[1.05] tracking-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl"
        >
          Rooted in science. Growing the future.
        </motion.h2>
        <motion.p variants={item} className="mt-5 max-w-lg text-pretty text-white/90 drop-shadow md:text-lg">
          We blend agronomy, bioengineering, and machine learning to help farms produce healthier yields with a lighter footprint.
          Every field is unique — our platform learns yours, season after season.
        </motion.p>
        <motion.div variants={item} className="mt-8 grid grid-cols-3 gap-4">
          {[
            { k: "10K+", v: "Farms onboarded" },
            { k: "32%", v: "Avg yield uplift" },
            { k: "18", v: "Countries served" },
          ].map((s) => (
            <div key={s.k} className="rounded-2xl border border-white/20 bg-black/30 p-4 backdrop-blur-md">
              <div className="font-sans text-2xl font-semibold text-white md:text-3xl">{s.k}</div>
              <div className="mt-1 text-xs text-white/80 md:text-sm">{s.v}</div>
            </div>
          ))}
        </motion.div>
      </div>
      <motion.div variants={item} className="space-y-3">
        {[
          { t: "Our Mission", d: "Make sustainable, profitable farming the global default." },
          { t: "Our Approach", d: "Sensors, satellites, and bio-research feeding one decision engine." },
          { t: "Our Promise", d: "Transparent data, responsible inputs, and resilient harvests." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
            <div className="font-sans text-lg font-semibold text-white">{c.t}</div>
            <p className="mt-1 text-sm leading-relaxed text-white/85">{c.d}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}

/* ----------------------------- SOLUTIONS ---------------------------- */
function SolutionsView() {
  const cards = [
    { icon: Cpu, title: "AI Crop Intelligence", desc: "Forecast yield, disease, and weather risk per plot in real time." },
    { icon: Microscope, title: "Bioengineered Seeds", desc: "Drought-resistant, high-protein varieties tuned to your soil." },
    { icon: Droplets, title: "Smart Irrigation", desc: "Save up to 40% water with sensor-driven watering schedules." },
    { icon: Sprout, title: "Soil Health Suite", desc: "Microbiome analysis with regenerative input recommendations." },
  ]
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" exit="exit">
      <motion.div variants={item} className="text-center">
        <h2 className="mx-auto max-w-3xl text-balance font-sans text-4xl font-medium tracking-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl">
          Solutions for every acre.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/90 drop-shadow md:text-lg">
          A modular platform that scales from a single greenhouse to thousand-hectare operations.
        </p>
      </motion.div>
      <motion.div variants={stagger} className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <motion.div
            key={c.title}
            variants={item}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="group rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition-colors hover:bg-white/15"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white">
              <c.icon className="h-5 w-5" />
            </span>
            <div className="mt-5 font-sans text-lg font-semibold text-white">{c.title}</div>
            <p className="mt-1.5 text-sm leading-relaxed text-white/85">{c.desc}</p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-sm text-green-300 transition-transform group-hover:translate-x-0.5">
              Learn more <ArrowUpRight className="h-4 w-4" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

/* -------------------------------- BLOG ------------------------------ */
function BlogView() {
  const posts = [
    { tag: "Research", title: "How CRISPR-edited wheat survived a record drought", date: "May 12, 2026", read: "6 min read" },
    { tag: "Product", title: "Introducing TerraNova Pulse: real-time field telemetry", date: "May 04, 2026", read: "4 min read" },
    { tag: "Field Notes", title: "Regenerative cover crops: a 3-season case study", date: "Apr 22, 2026", read: "8 min read" },
  ]
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" exit="exit">
      <motion.div variants={item} className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="font-sans text-4xl font-medium tracking-tight text-white drop-shadow-lg md:text-5xl">
            Field journal
          </h2>
          <p className="mt-3 max-w-lg text-white/90 drop-shadow">
            Stories from researchers, growers, and engineers building the future of food.
          </p>
        </div>
        <a href="#" className="text-sm text-white/90 underline-offset-4 hover:underline">
          View all posts →
        </a>
      </motion.div>
      <motion.div variants={stagger} className="mt-8 grid gap-4 md:grid-cols-3">
        {posts.map((p) => (
          <motion.article
            key={p.title}
            variants={item}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
          >
            <span className="self-start rounded-full bg-green-600/90 px-3 py-1 text-xs font-medium text-white">
              {p.tag}
            </span>
            <h3 className="mt-5 font-sans text-xl font-semibold leading-snug text-white">{p.title}</h3>
            <div className="mt-auto flex items-center justify-between pt-6 text-xs text-white/70">
              <span>{p.date}</span>
              <span>{p.read}</span>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------ CONTACT ----------------------------- */
function ContactView() {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" exit="exit" className="grid gap-8 md:grid-cols-2">
      <div>
        <motion.h2
          variants={item}
          className="font-sans text-4xl font-medium tracking-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl"
        >
          Let&apos;s grow something together.
        </motion.h2>
        <motion.p variants={item} className="mt-4 max-w-md text-white/90 drop-shadow md:text-lg">
          Tell us about your operation and we&apos;ll match you with the right solutions specialist.
        </motion.p>
        <motion.ul variants={stagger} className="mt-8 space-y-3">
          {[
            { icon: Mail, label: "hello@terranova.farm" },
            { icon: Phone, label: "+1 (415) 555-0142" },
            { icon: MapPin, label: "Davis, California" },
          ].map((c) => (
            <motion.li
              key={c.label}
              variants={item}
              className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600">
                <c.icon className="h-4 w-4" />
              </span>
              <span className="text-sm md:text-base">{c.label}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
      <motion.form
        variants={item}
        onSubmit={(e) => e.preventDefault()}
        className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" placeholder="Jane Grower" />
          <Field label="Email" type="email" placeholder="jane@farm.com" />
        </div>
        <Field label="Farm / Company" placeholder="Green Acres Co." />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/85">How can we help?</label>
          <textarea
            rows={4}
            placeholder="Tell us about your fields, crops, and goals..."
            className="w-full resize-none rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-green-400 focus:bg-black/30"
          />
        </div>
        <button
          type="submit"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-700 py-3 text-sm font-medium text-white transition hover:bg-green-800 md:text-base"
        >
          Send message
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </motion.form>
    </motion.div>
  )
}

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/85">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-green-400 focus:bg-black/30"
      />
    </div>
  )
}
