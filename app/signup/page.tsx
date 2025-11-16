'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Brain, ArrowRight, CheckCircle2, Sparkles, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      toast({
        title: 'Account created!',
        description: 'Welcome to Mindful AI. Redirecting to your dashboard...',
      })

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="h-12 w-12 bg-gradient-to-br from-slate-900 to-purple-900 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">
              Mindful AI
            </span>
          </div>

          {/* Form */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
              <p className="text-gray-600">Start your wellbeing journey in under 60 seconds</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="h-12 text-base border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-slate-900 to-purple-900 hover:from-slate-800 hover:to-purple-800 text-white font-semibold text-base shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 pt-4 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Your data is encrypted and secure</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <motion.div
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Content Container with Proper Layout */}
        <div className="relative z-10 flex flex-col h-full w-full items-center justify-center px-12 xl:px-16 py-16">
          <div className="w-full max-w-xl space-y-12">
            {/* Top - Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Mindful AI</h1>
                  <p className="text-xs text-white/60">Your wellbeing companion</p>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Heading */}
              <div className="space-y-6">
                <h2 className="text-5xl xl:text-6xl font-bold leading-[1.1] text-white">
                  Begin your journey to
                  <span className="block text-purple-300 mt-2">better mental health</span>
                </h2>
                <p className="text-lg text-white/70 leading-relaxed max-w-md">
                  Join thousands of users improving their wellbeing with personalized AI insights, mood tracking, and journaling.
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-4">
                {[
                  { icon: CheckCircle2, title: 'Free forever', desc: 'No credit card required' },
                  { icon: Brain, title: 'AI-powered insights', desc: 'Personalized for you' },
                  { icon: Shield, title: 'Private & secure', desc: 'Your data stays yours' },
                  { icon: Zap, title: 'Get started quickly', desc: 'Under 60 seconds' },
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                    className="flex items-start gap-4 px-4 py-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <benefit.icon className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-base text-white">{benefit.title}</div>
                      <div className="text-sm text-white/60">{benefit.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="pt-8 border-t border-white/10"
            >
              <div className="flex items-center gap-12">
                <div>
                  <div className="text-3xl font-bold text-white">10K+</div>
                  <div className="text-sm text-white/60 mt-1">Active users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">4.9★</div>
                  <div className="text-sm text-white/60 mt-1">User rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">100K+</div>
                  <div className="text-sm text-white/60 mt-1">Journals</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
