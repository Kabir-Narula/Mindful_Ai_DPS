'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Walkthrough from '@/components/tutorial/walkthrough'
import TutorialNotebook from '@/components/tutorial/tutorial-notebook'

interface TutorialWrapperProps {
  tutorialCompleted: boolean
  userCreatedAt: Date
  children: React.ReactNode
}

export default function TutorialWrapper({ tutorialCompleted, userCreatedAt, children }: TutorialWrapperProps) {
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [isCompleted, setIsCompleted] = useState(tutorialCompleted)
  const router = useRouter()

  useEffect(() => {
    // Logic: Only show if:
    // 1. Not completed
    // 2. Not dismissed in this session (localStorage)
    // 3. User is "new" (created within last 24 hours)
    
    const dismissed = localStorage.getItem('tutorial-dismissed')
    const isNewUser = new Date().getTime() - new Date(userCreatedAt).getTime() < 24 * 60 * 60 * 1000

    if (!isCompleted && !dismissed && isNewUser) {
      // Small delay to let page render
      const timer = setTimeout(() => setShowWalkthrough(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [isCompleted, userCreatedAt])

  const handleComplete = async () => {
    try {
      const res = await fetch('/api/tutorial/complete', {
        method: 'POST'
      })
      if (res.ok) {
        setIsCompleted(true)
        setShowWalkthrough(false)
        localStorage.setItem('tutorial-dismissed', 'true')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to mark tutorial complete:', error)
    }
  }

  const handleDismiss = () => {
    setShowWalkthrough(false)
    localStorage.setItem('tutorial-dismissed', 'true')
    // Don't mark as completed in DB, just dismiss for this session
  }

  return (
    <>
      {children}
      
      {/* Walkthrough Overlay - Only show if not dismissed */}
      <Walkthrough 
        onComplete={handleComplete}
        onDismiss={handleDismiss}
        isVisible={showWalkthrough && !isCompleted}
      />

      {/* Tutorial Notebook (Always available) */}
      <TutorialNotebook tutorialCompleted={isCompleted} />
    </>
  )
}

