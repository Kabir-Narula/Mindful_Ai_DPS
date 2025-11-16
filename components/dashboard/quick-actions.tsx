'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, MessageSquare, Activity, Target, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function QuickActions() {
  const actions = [
    {
      title: 'New Journal',
      description: 'Write about your day',
      icon: BookOpen,
      href: '/dashboard/journal/new',
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      title: 'AI Chat',
      description: 'Talk about feelings',
      icon: MessageSquare,
      href: '/dashboard/chat',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Track Mood',
      description: 'Log current mood',
      icon: Activity,
      href: '/dashboard/journal/new',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      title: 'New Goal',
      description: 'Set a new goal',
      icon: Target,
      href: '/dashboard/goals',
      gradient: 'from-orange-500 to-amber-500',
    },
  ]

  return (
    <Card className="border-none shadow-xl bg-white/70 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold">Quick Actions</CardTitle>
        <CardDescription className="text-base">
          What would you like to do today?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <Link href={action.href}>
                <div className="group relative overflow-hidden rounded-xl p-5 cursor-pointer bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                  {/* Icon */}
                  <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${action.gradient} mb-3 shadow-md`}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">
                      {action.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {action.description}
                    </p>
                    
                    {/* Arrow */}
                    <div className={`flex items-center text-xs font-semibold bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`}>
                      <span>Go</span>
                      <ArrowRight className="h-3 w-3 ml-1 text-gray-600" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
