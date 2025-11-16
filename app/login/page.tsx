'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Brain, ArrowRight, Heart, TrendingUp, Shield, Sparkles } from 'lucide-react'
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
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
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
      {/* LEFT SIDE - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <motion.div
            className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
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
                  Welcome back to your
                  <span className="block text-purple-300 mt-2">mindfulness journey</span>
                </h2>
                <p className="text-lg text-white/70 leading-relaxed max-w-md">
                  Track your mood, journal your thoughts, and discover insights powered by AI to support your mental wellbeing.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Heart, text: 'Mood Tracking' },
                  { icon: Brain, text: 'AI Insights' },
                  { icon: TrendingUp, text: 'Progress' },
                  { icon: Shield, text: 'Private & Secure' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <feature.icon className="h-5 w-5 text-purple-300 flex-shrink-0" />
                    <span className="text-sm font-medium text-white">{feature.text}</span>
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

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
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
              <h1 className="text-3xl font-bold text-gray-900">Sign in to your account</h1>
              <p className="text-gray-600">Enter your credentials to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
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
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Sign up for free
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
    </div>
  )
}
