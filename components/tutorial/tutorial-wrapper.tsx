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
    // Simplified logic: Show tutorial if:
    // 1. Not already completed (in database)
    // 2. Not dismissed in THIS browser session
    //
    // The localStorage key is now user-specific to prevent cross-user issues
    // and we clear it on completion so it only tracks the current session

    const userDismissedKey = `tutorial-dismissed-${userCreatedAt.getTime()}`
    const dismissed = sessionStorage.getItem(userDismissedKey) === 'true'

    // If tutorial not completed in DB and not dismissed this session, show it
    if (!isCompleted && !dismissed) {
      // Small delay to let page render and ensure smooth transition
      const timer = setTimeout(() => setShowWalkthrough(true), 1000)
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
        // Clear any old dismiss flags since we completed properly
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to mark tutorial complete:', error)
    }
  }

  const handleDismiss = () => {
    setShowWalkthrough(false)
    // Use sessionStorage so dismiss only lasts for this browser session
    // Next session they'll see the tutorial again unless they complete it
    const userDismissedKey = `tutorial-dismissed-${userCreatedAt.getTime()}`
    sessionStorage.setItem(userDismissedKey, 'true')
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

