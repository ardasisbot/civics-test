'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { Switch } from "@/components/ui/switch"
import { useSearchParams } from 'next/navigation'
import { useQuizParams } from '@/hooks/useQuizParams'
import { useQuiz } from '@/hooks/useQuizState'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function TogglesContent() {
  const searchParams = useSearchParams()
  const params = useQuizParams(searchParams)
  const { clearQuiz } = useQuiz(params)
  const { mode, answerType } = params
  const isTestRoute = searchParams?.has('mode') ?? false

  const [showModeAlert, setShowModeAlert] = useState(false)
  const [showAnswerTypeAlert, setShowAnswerTypeAlert] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if the screen width is mobile
  const checkScreenSize = useCallback(() => {
    setIsMobile(window.innerWidth <= 640) // Adjust breakpoint if needed
  }, [])

  useEffect(() => {
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [checkScreenSize])

  const handleModeChange = () => {
    if (isMobile) {
      handleModeConfirm()
    } else {
      setShowModeAlert(true)
    }
  }

  const handleAnswerTypeChange = () => {
    if (isMobile) {
      handleAnswerTypeConfirm()
    } else {
      setShowAnswerTypeAlert(true)
    }
  }

  const handleModeConfirm = () => {
    const newMode = mode === 'full' ? 'sample' : 'full'
    clearQuiz()
    window.location.href = `/test?mode=${newMode}`
    setShowModeAlert(false)
  }

  const handleAnswerTypeConfirm = () => {
    const newAnswerType = answerType === 'easy' ? 'hard' : 'easy'
    clearQuiz()
    window.location.href = `/test?mode=${mode}&answerType=${newAnswerType}`
    setShowAnswerTypeAlert(false)
  }

  if (!isTestRoute) return null

  return (
    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
      {/* Test Mode Switch */}
      <div className="flex items-center">
        <div className="flex items-center space-x-3 px-3 py-1.5 rounded-full bg-muted/50">
          <span className={`text-sm transition-all ${
            mode === 'sample' 
              ? 'text-foreground font-semibold' 
              : 'text-muted-foreground'
          }`}>
            Sample Test
          </span>
          <Switch
            checked={mode === 'full'}
            onCheckedChange={handleModeChange}
            id="test-mode"
            className="data-[state=checked]:bg-black data-[state=unchecked]:bg-black"
          />
          <span className={`text-sm transition-all ${
            mode === 'full' 
              ? 'text-foreground font-semibold' 
              : 'text-muted-foreground'
          }`}>
            Full Test
          </span>
        </div>
      </div>

      {/* Answer Type Controls */}
      <div className="flex items-center">
        <div className="flex items-center space-x-3 px-3 py-1.5 rounded-full bg-muted/50">
          <span className={`text-sm transition-all ${
            answerType === 'easy' 
              ? 'text-foreground font-semibold' 
              : 'text-muted-foreground'
          }`}>
            Easy
          </span>
          <Switch
            checked={answerType === 'hard'}
            onCheckedChange={handleAnswerTypeChange}
            id="answer-mode"
            className="data-[state=checked]:bg-black data-[state=unchecked]:bg-black"
          />
          <span className={`text-sm transition-all ${
            answerType === 'hard' 
              ? 'text-foreground font-semibold' 
              : 'text-muted-foreground'
          }`}>
            Hard
          </span>
        </div>
      </div>

      {/* Only show AlertDialog on desktop screens */}
      {!isMobile && (
        <>
          <AlertDialog open={showModeAlert} onOpenChange={setShowModeAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change Test Mode?</AlertDialogTitle>
                <AlertDialogDescription>
                  Changing the test mode will reset your current progress. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleModeConfirm}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showAnswerTypeAlert} onOpenChange={setShowAnswerTypeAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change Answer Mode?</AlertDialogTitle>
                <AlertDialogDescription>
                  Changing the answer mode will reset your current progress. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAnswerTypeConfirm}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

export function Toggles() {
  return (
    <Suspense>
      <TogglesContent />
    </Suspense>
  )
}
