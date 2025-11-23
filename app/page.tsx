import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { ArrowRight, Brain, Sparkles } from 'lucide-react'

export default async function Home() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 md:px-16 py-8 flex justify-between items-center mix-blend-difference text-black">
        <div className="font-serif font-bold tracking-tight text-xl">Mindful AI</div>
        <div className="flex gap-8 text-sm font-medium tracking-wide uppercase">
          <Link href="/login" className="hover:underline underline-offset-4">Sign In</Link>
          <Link href="/signup" className="hover:underline underline-offset-4">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section - The Cover */}
      <section className="min-h-screen flex flex-col justify-center px-8 md:px-16 pt-24">
        <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <span className="block text-xs font-bold tracking-[0.2em] uppercase mb-8 text-gray-500">
              Issue 01 — The Clarity
            </span>
            <h1 className="text-[12vw] leading-[0.85] font-serif tracking-tighter mb-12">
              Design <br />
              <span className="italic text-gray-400">Your Mind.</span>
            </h1>
            <div className="max-w-xl">
              <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-800 mb-8">
                A digital sanctuary for your thoughts. Track moods, journal freely, and let AI help you find patterns in the noise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="inline-flex h-14 items-center justify-center bg-black text-white px-8 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors">
                  Begin Ritual <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/login" className="inline-flex h-14 items-center justify-center border border-black text-black px-8 text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 hidden lg:block">
            <div className="aspect-[3/4] bg-gray-200 relative overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
              {/* Abstract visual representation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
              <div className="absolute bottom-8 left-8 text-white">
                <p className="font-serif text-3xl italic">"Clarity is not a destination,<br />but a practice."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 1: The Problem */}
      <section className="py-32 px-8 md:px-16 border-t border-gray-200">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <span className="text-xs font-bold tracking-[0.2em] uppercase block mb-4">Chapter 01</span>
            <h2 className="text-5xl font-serif mb-8">The Noise</h2>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            <p className="text-lg font-light leading-relaxed text-gray-600">
              In a world of constant notifications and infinite feeds, our internal monologue gets drowned out. We lose touch with how we actually feel, drifting through days on autopilot.
            </p>
            <p className="text-lg font-light leading-relaxed text-gray-600">
              Without a space to process, emotions compound. Stress becomes background noise. We need a tool that doesn't just record, but helps us understand.
            </p>
          </div>
        </div>
      </section>

      {/* Chapter 2: The Solution */}
      <section className="py-32 px-8 md:px-16 bg-white text-black">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-24 text-center">
            <span className="text-xs font-bold tracking-[0.2em] uppercase block mb-4 text-gray-400">Chapter 02</span>
            <h2 className="text-6xl md:text-8xl font-serif">The Solution</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100 border border-gray-100">
            {[
              { title: "Journal", desc: "A distraction-free space to write. No clutter, just you and your thoughts." },
              { title: "Track", desc: "Log your mood daily. Visualize your emotional landscape over time." },
              { title: "Analyze", desc: "AI-powered insights reveal hidden patterns in your wellbeing." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-12 hover:bg-gray-50 transition-colors duration-500 group">
                <span className="text-xs font-mono text-gray-300 mb-8 block">0{i + 1}</span>
                <h3 className="text-3xl font-serif mb-4 group-hover:italic transition-all">{feature.title}</h3>
                <p className="text-gray-500 font-light leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-8 md:px-16 border-t border-gray-200 bg-[#F9F8F5]">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div>
            <h2 className="text-9xl font-serif tracking-tighter leading-none mb-8">
              Mindful.
            </h2>
            <p className="text-sm font-mono text-gray-400">
              © 2024 MINDFUL AI LABS. <br />
              DESIGNED FOR CLARITY.
            </p>
          </div>
          <div className="flex flex-col gap-4 text-right">
            <Link href="/login" className="text-lg font-serif italic hover:underline">Sign In</Link>
            <Link href="/signup" className="text-lg font-serif italic hover:underline">Start Journey</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

