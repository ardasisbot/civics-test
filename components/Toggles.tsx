'use client'

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from 'react'

export function Toggles() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode')
  const view = searchParams.get('view') || 'paginated'
  const answerType = searchParams.get('answerType') || 'multiple'
  const isTestRoute = searchParams.has('mode')
  const [showAlert, setShowAlert] = useState(false)
  const [showMissedAlert, setShowMissedAlert] = useState(false)
  const reviewMissed = searchParams.get('reviewMissed') === 'true'

  const handleModeChange = () => {
    localStorage.clear() // Clear saved answers
    const newMode = mode === 'full' ? 'sample' : 'full'
    router.push(`/test?mode=${newMode}&view=${view}&answerType=${answerType}`)
  }

  const handleMissedStateChange = () => {
    setShowMissedAlert(true)
  }

  if (!isTestRoute) {
    return (
        <></>
    )
  }

  return (
    <div className="flex items-center space-x-6">
      {/* Test Mode Switch with Alert */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={mode === 'full'}
          onCheckedChange={handleModeChange}
          id="test-mode"
        />
        <Label htmlFor="test-mode" className="text-sm">
          {mode === 'full' ? 'Full Test' : 'Practice Test'}
        </Label>

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

      {/* View Mode Controls */}
      {/* <div className="flex items-center space-x-2">
        <Link href={`/test?mode=${mode}&view=${view === 'paginated' ? 'all' : 'paginated'}&answerType=${answerType}`}>
          <Switch
            checked={view === 'paginated'}
            id="view-mode"
          />
        </Link>
        <Label htmlFor="view-mode" className="text-sm">
          {view === 'paginated' ? 'Question by Question' : 'All Questions'}
        </Label>
      </div> */}

      {/* Answer Type Controls */}
      <div className="flex items-center space-x-2">
        <Link href={`/test?mode=${mode}&view=${view}&answerType=${answerType === 'multiple' ? 'text' : 'multiple'}`}>
          <Switch
            checked={answerType === 'multiple'}
            id="answer-mode"
          />
        </Link>
        <Label htmlFor="answer-mode" className="text-sm">
          {answerType === 'multiple' ? 'Multiple Choice' : 'Open Text'}
        </Label>
      </div>

      {/* Review Missed Questions Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={reviewMissed}
          onCheckedChange={handleMissedStateChange}
          id="review-missed"
        />
        <Label htmlFor="review-missed" className="text-sm">
          Review Missed
        </Label>

        <AlertDialog open={showMissedAlert} onOpenChange={setShowMissedAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {reviewMissed ? 'Disable Review Missed?' : 'Enable Review Missed?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {reviewMissed 
                  ? 'This will clear your missed questions history.'
                  : 'This will only show questions you haven\'t answered correctly yet.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (!reviewMissed) {
                  router.push(`/test?mode=${mode}&view=${view}&answerType=${answerType}&reviewMissed=true`)
                } else {
                  localStorage.removeItem('missedQuestions')
                  router.push(`/test?mode=${mode}&view=${view}&answerType=${answerType}`)
                }
                setShowMissedAlert(false)
              }}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
} 