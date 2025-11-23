'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Brain, LogOut, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import GlobalChatSheet from '@/components/dashboard/global-chat-sheet'

interface DashboardNavProps {
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [chatOpen, setChatOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast({
        title: 'Logged out',
        description: 'See you next time.',
      })
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      })
    }
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/journal', label: 'Journal' },
    { href: '/dashboard/goals', label: 'Goals' },
    { href: '/dashboard/patterns', label: 'Patterns' },
  ]

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  // Determine context based on current page
  const getChatContext = () => {
    if (pathname.includes('/journal/')) {
      const id = pathname.split('/').pop()
      return { page: 'journal', entryId: id }
    }
    if (pathname.includes('/goals')) {
      return { page: 'goals' }
    }
    return { page: 'dashboard' }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#F9F8F5]/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-8 md:px-16">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-12">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="h-8 w-8 bg-black text-white flex items-center justify-center rounded-none group-hover:bg-gray-800 transition-colors">
                  <Brain className="h-4 w-4" />
                </div>
                <span className="text-lg font-serif font-bold tracking-tight text-black">Mindful AI</span>
              </Link>

              <div className="hidden md:flex items-center gap-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "text-sm font-medium tracking-wide transition-colors hover:text-black",
                        isActive ? "text-black border-b border-black pb-1" : "text-gray-500"
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* AI Chat Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChatOpen(true)}
                className="hidden md:flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>AI Coach</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 rounded-none">
                      <AvatarFallback className="rounded-none bg-gray-200 text-gray-700 font-bold">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <GlobalChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        context={getChatContext()}
      />
    </>
  )
}
