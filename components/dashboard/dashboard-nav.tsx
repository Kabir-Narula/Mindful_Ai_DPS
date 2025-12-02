'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Brain, LogOut, Menu, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/archive', label: 'Archive' },
  { href: '/dashboard/insights', label: 'Insights' },
  { href: '/cbt', label: 'Exercises' },
]

const getInitials = (name: string | null, email: string): string => {
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

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [chatOpen, setChatOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  // Determine context based on current page
  const getChatContext = () => {
    if (pathname.includes('/cbt')) {
      return { page: 'cbt' }
    }
    if (pathname.includes('/insights')) {
      return { page: 'insights' }
    }
    return { page: 'dashboard' }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            <div className="flex items-center gap-8">
              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden hover:bg-gray-100/80 rounded-xl">
                    <Menu className="h-5 w-5 text-gray-700" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] border-r-0 shadow-2xl">
                  <SheetHeader>
                    <SheetTitle className="font-serif text-left text-xl flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center rounded-xl">
                        <Brain className="h-4 w-4" />
                      </div>
                      Mindful AI
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-8">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "text-base font-medium transition-all px-4 py-3 rounded-xl",
                          pathname === item.href
                            ? "bg-gray-100 text-gray-900 font-semibold"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 my-4" />
                    <Button
                      variant="outline"
                      className="justify-start gap-3 h-12 rounded-xl border-gray-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setChatOpen(true)
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat with AI Companion
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="h-9 w-9 bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <Brain className="h-4 w-4" />
                </div>
                <span className="text-lg font-serif font-bold tracking-tight text-gray-900 hidden sm:inline-block">
                  Mindful AI
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "text-sm font-medium tracking-wide transition-all px-4 py-2 rounded-lg",
                        isActive
                          ? "text-gray-900 bg-gray-100"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              {/* Chat Trigger (Desktop) */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-10 w-10 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition-colors"
                onClick={() => setChatOpen(true)}
                title="Chat with AI Companion"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-gray-100">
                    <Avatar className="h-9 w-9 rounded-xl border-2 border-gray-200 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 font-semibold text-sm rounded-xl">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl shadow-xl border-gray-200/80" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-gray-900">{user.name || 'User'}</p>
                      <p className="text-xs leading-none text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer mx-2 mb-2 rounded-lg"
                  >
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
