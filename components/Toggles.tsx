'use client'

import { Suspense } from 'react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuizParams } from '@/hooks/useQuizParams'
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
import { useState } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

function TogglesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { mode, view, answerType } = useQuizParams(searchParams)
  const isTestRoute = searchParams.has('mode')
  const [showAlert, setShowAlert] = useState(false)
  
  const handleModeChange = () => {
    localStorage.clear() // Clear saved answers
    const newMode = mode === 'full' ? 'sample' : 'full'
    router.push(`/test?mode=${newMode}&view=${view}&answerType=${answerType}`)
  }

  if (!isTestRoute) return null

  return (
    <div className="flex items-center space-x-6">
      {/* Test Mode Switch with Alert */}
      <div className="flex items-center space-x-2">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center space-x-2">
              <Switch
                checked={mode === 'full'}
                onCheckedChange={handleModeChange}
                id="test-mode"
              />
              <Label htmlFor="test-mode" className="text-sm cursor-help">
                {mode === 'full' ? 'Full Test' : 'Sample Test'}
              </Label>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">

              <p className="text-sm">
                Switch between a full 100-question test or a quick 5-question sample. 
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>

        <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Test Mode?</AlertDialogTitle>
              <AlertDialogDescription>
                Changing the test mode will reset your current progress. Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                localStorage.clear()
                const newMode = mode === 'full' ? 'sample' : 'full'
                router.push(`/test?mode=${newMode}&view=${view}&answerType=${answerType}`)
                setShowAlert(false)
              }}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Answer Type Controls */}
      <div className="flex items-center space-x-2">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center space-x-2">
              <Link href={`/test?mode=${mode}&view=${view}&answerType=${answerType === 'easy' ? 'hard' : 'easy'}`}>
                <Switch
                  checked={answerType === 'easy'}
                  id="answer-mode"
                />
              </Link>
              <Label htmlFor="answer-mode" className="text-sm cursor-help">
                {answerType === 'easy' ? 'Easy Mode' : 'Hard Mode'}
              </Label>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              {/* <h4 className="text-sm font-semibold">Difficulty Mode</h4> */}
              <p className="text-sm">
                Easy Mode: Multiple choice questions to help you learn.<br />
                Hard Mode: Open text answers for realistic test practice.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>


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