import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from 'next/navigation'

interface ReviewProps {
  score: number
  totalQuestions: number
  mode: string | null
  onClearQuiz: () => void
  onReviewClick: () => void
  skippedQuestions?: string[]
  onReviewSkipped?: () => void
}

export function Review({
  score,
  totalQuestions,
  mode,
  onClearQuiz,
  onReviewClick,
  skippedQuestions = [],
  onReviewSkipped
}: ReviewProps) {
  const router = useRouter()

  const getActionButton = () => {
    
      return (
        <div className="flex gap-4">
          <Button
            onClick={() => {
              onClearQuiz()
              router.push('/test?mode=sample')
            }}
            variant="default"
            className={`font-semibold ${
              mode === 'sample' && score <= 80 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : ''
            }`}
          >
            {mode === 'sample' ? 'Take Another Sample' : 'Take a Sample'}
          </Button>
          <Button
            onClick={() => {
              onClearQuiz()
              router.push('/test?mode=full')
            }}
            variant="default"
            className={`font-semibold ${
              mode === 'sample' && score > 80 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : ''
            }`}
          >
            Take the Full Test →
          </Button>

        </div>
      )
    
  }

  return (
    <Card className="mb-8 p-3 sm:p-5  bg-gradient-to-r from-blue-50 to-indigo-50 ">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Score
          </h2>
          <div className="text-5xl font-bold text-blue-600">
            {score.toFixed(1)}%
          </div>
          <p className="text-gray-600 mt-2">
            {Math.round((score / 100) * totalQuestions)} out of {totalQuestions} correct
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 ">
          {getActionButton()}
          <Button
            onClick={onReviewClick}
            variant="outline"
            className="font-semibold"
          >
            Review Answers
          </Button>
          {skippedQuestions.length > 0 && (
            <Button
              onClick={onReviewSkipped}
              variant="outline"
              className="font-semibold text-yellow-600 hover:text-yellow-700"
            >
              Review Skipped ({skippedQuestions.length})
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
} 