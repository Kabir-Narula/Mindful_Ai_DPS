import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { email, password, name } = body

    // Email validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be 128 characters or less' },
        { status: 400 }
      )
    }

    // Name validation (optional)
    if (name && (typeof name !== 'string' || name.trim().length > 100)) {
      return NextResponse.json(
        { error: 'Name must be a string with 100 characters or less' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name: name?.trim() || null,
      },
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    // Set cookie
    await setAuthCookie(token)

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}

