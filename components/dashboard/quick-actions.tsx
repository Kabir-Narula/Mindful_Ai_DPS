'use client'

import { BookOpen, MessageSquare, Activity, Target, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default function QuickActions() {
  const actions = [
    {
      title: 'New Journal',
      icon: BookOpen,
      href: '/dashboard/journal/new',
    },
    {
      title: 'New Goal',
      icon: Target,
      href: '/dashboard/goals',
    },
    {
      title: 'Track Mood',
      icon: Activity,
      href: '/dashboard/journal/new',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className="group flex items-center justify-between p-4 border border-gray-200 hover:border-black hover:bg-white transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <action.icon className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
            <span className="font-serif text-lg text-gray-600 group-hover:text-black transition-colors">
              {action.title}
            </span>
          </div>
          <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-black transition-colors" />
        </Link>
      ))}
    </div>
  )
}
