'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      toast({
        title: 'Welcome back',
        description: 'Your session has resumed.',
      })

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Access Denied',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F9F8F5] text-[#1A1A1A]">
      {/* LEFT SIDE - Editorial Statement */}
      <div className="hidden lg:flex lg:w-1/2 relative border-r border-[#E5E5E5] items-center justify-center p-16">
        <div className="max-w-lg space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-4 block">
              The Ritual
            </span>
            <h1 className="text-7xl font-serif leading-[0.9] tracking-tight mb-6">
              Return to <br />
              <span className="italic text-gray-400">Clarity.</span>
            </h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed max-w-sm">
              Resume your journey of self-reflection. Your mind is a garden; tend to it with patience and consistency.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="absolute bottom-12 left-12"
          >
            <p className="text-xs font-mono text-gray-400">
              EST. 2024 — MINDFUL AI
            </p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE - Minimal Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md space-y-12"
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-serif">Sign In</h2>
            <p className="text-gray-500 font-light">Enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-b border-gray-200 focus:border-black px-0 rounded-none bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-gray-400 hover:text-black transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-b border-gray-200 focus:border-black px-0 rounded-none bg-transparent"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800 rounded-none h-14 text-sm tracking-widest uppercase transition-all"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Enter Workspace <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>

            <div className="text-center pt-8 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                New here?{' '}
                <Link
                  href="/signup"
                  className="text-black font-medium hover:underline underline-offset-4"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
