'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Brain, BookOpen, TrendingUp, MessageCircle, Target, LogOut, User } from 'lucide-react'
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
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
    { href: '/dashboard', label: 'Overview', icon: TrendingUp },
    { href: '/dashboard/journal', label: 'Journal', icon: BookOpen },
    { href: '/dashboard/chat', label: 'AI Chat', icon: MessageCircle },
    { href: '/dashboard/goals', label: 'Goals', icon: Target },
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

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-9 w-9 bg-gradient-to-br from-slate-900 to-purple-900 rounded-xl flex items-center justify-center shadow-md">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">Mindful AI</span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-white">
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
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden pb-3 flex space-x-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

