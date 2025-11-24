import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dayLogId, reflection } = await req.json()

    if (!dayLogId || !reflection) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const updated = await prisma.dayLog.update({
        where: { id: dayLogId },
        data: { eveningReflection: reflection }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

