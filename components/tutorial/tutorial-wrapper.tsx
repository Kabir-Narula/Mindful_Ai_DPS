'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Walkthrough from '@/components/tutorial/walkthrough'
import TutorialNotebook from '@/components/tutorial/tutorial-notebook'

interface TutorialWrapperProps {
  tutorialCompleted: boolean
  children: React.ReactNode
}

export default function TutorialWrapper({ tutorialCompleted, children }: TutorialWrapperProps) {
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [isCompleted, setIsCompleted] = useState(tutorialCompleted)
  const router = useRouter()

  useEffect(() => {
    // Only show walkthrough if user hasn't completed it AND hasn't dismissed it
    // Check localStorage to see if user has dismissed it
    const dismissed = localStorage.getItem('tutorial-dismissed')
    if (!isCompleted && !dismissed) {
      // Small delay to let page render - but make it less intrusive
      setTimeout(() => setShowWalkthrough(true), 1000)
    }
  }, [isCompleted])

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

