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
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-8">
              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="font-serif text-left text-xl">Mindful AI</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-8">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "text-lg font-medium transition-colors hover:text-primary",
                          pathname === item.href ? "text-primary font-bold" : "text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Button 
                      variant="outline" 
                      className="mt-4 justify-start gap-2"
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

              <Link href="/dashboard" className="flex items-center gap-2 md:gap-3 group">
                <div className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center rounded-sm group-hover:opacity-90 transition-opacity">
                  <Brain className="h-4 w-4" />
                </div>
                <span className="text-lg font-serif font-bold tracking-tight text-foreground hidden sm:inline-block">Mindful AI</span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "text-sm font-medium tracking-wide transition-colors hover:text-foreground",
                        isActive ? "text-foreground border-b-2 border-primary pb-1" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Chat Trigger (Desktop) */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex"
                onClick={() => setChatOpen(true)}
                title="Chat with AI Companion"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10 rounded-full border border-border">
                      <AvatarFallback className="bg-muted text-muted-foreground font-medium">
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
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
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
