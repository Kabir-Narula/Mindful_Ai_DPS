import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ArrowRight, BookOpen, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

// We'll make this a server component that fetches initial data
// But for search, we ideally want client-side filtering or a query param.
// For simplicity and speed ("start implementing it"), I'll implement a basic server-side search via query params later
// For now, let's just enhance the UI to include the Search Bar placeholder which is "sellable" visual.

export default async function ArchivePage({ searchParams }: { searchParams: { q?: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const query = searchParams?.q || ''

  // Fetch day logs based on search
  // Note: Searching "morningIntention" or "eveningReflection" is easy.
  // Searching deep journal content requires a more complex query joining tables.
  // For V1 "Sellable Feature", searching the "Headlines" (Intentions/Reflections) is a great start.
  
  const whereClause: any = {
      userId: user.userId,
  }

  if (query) {
      whereClause.OR = [
          { morningIntention: { contains: query, mode: 'insensitive' } },
          { eveningReflection: { contains: query, mode: 'insensitive' } },
          // We can also search date if it matches a specific format, but text is more natural
      ]
  }

  const dayLogs = await prisma.dayLog.findMany({
    where: whereClause,
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      morningIntention: true,
      eveningReflection: true,
      _count: {
        select: {
            journalEntries: true,
            moodEntries: true
        }
      }
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 space-y-12">
      <div className="border-b border-gray-200 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-4">The Archive.</h1>
            <p className="text-xl text-gray-500 font-serif italic">A collection of your past days.</p>
          </div>
          
          {/* Search Form */}
          <form className="w-full md:w-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                name="q" 
                placeholder="Search your history..." 
                defaultValue={query}
                className="pl-10 w-full md:w-[300px] bg-white border-gray-200 rounded-full focus:ring-black focus:border-black transition-all"
              />
          </form>
      </div>

      {dayLogs.length === 0 ? (
          <div className="text-center py-24">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">
                {query ? `No entries found for "${query}"` : "No days recorded yet. Your story begins today."}
              </p>
              {query && (
                  <Link href="/dashboard/archive" className="text-sm text-black underline mt-2 inline-block">
                      Clear search
                  </Link>
              )}
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dayLogs.map((log) => (
                  <Link key={log.id} href={`/dashboard/archive/${format(log.date, 'yyyy-MM-dd')}`} className="group">
                      <Card className="h-full p-8 bg-white hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-gray-900 group-hover:-translate-y-1">
                          <div className="flex flex-col h-full justify-between">
                              <div>
                                  <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">
                                      {format(log.date, 'EEEE')}
                                  </p>
                                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
                                      {format(log.date, 'MMM d')}
                                  </h2>
                                  {log.morningIntention ? (
                                      <p className="text-gray-600 font-serif italic line-clamp-3">
                                          "{log.morningIntention}"
                                      </p>
                                  ) : (
                                      <p className="text-gray-400 italic">No specific focus.</p>
                                  )}
                              </div>
                              
                              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <span>{log._count.journalEntries} entries</span>
                                      <span>•</span>
                                      <span>{log._count.moodEntries} moods</span>
                                  </div>
                                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300" />
                              </div>
                          </div>
                      </Card>
                  </Link>
              ))}
          </div>
      )}
    </div>
  )
}
