'use client';

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"

import { Question, Choice, OpenTextMode, MultipleChoiceMode } from '@/types/question'
import questionsData from '@/output/questions_with_hints.json'
import { Question as QuestionComponent } from '@/components/Question'
import { Review } from '@/components/Review'

// Type for tracking user answers
type UserAnswers = {
  [questionId: string]: string[] | string; // Can be array for multiple choice or string for open text
};

type EvaluationResults = {
  [questionId: string]: {
    is_correct: boolean;
    explanation?: string;
  };
};

const getLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }
  return null
}

export default function Test() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get all parameters from URL
  const mode = searchParams.get('mode') || 'sample'
  const view = searchParams.get('view') || 'paginated'
  const answerType = searchParams.get('answerType') || 'multiple'

  const isPaginatedView = view === 'paginated'
  const isMultipleChoice = answerType === 'multiple'

  // Core quiz state
  const [questions, setQuestions] = useState<Question[]>([])
  const [userAnswers, setUserAnswers] = useState<UserAnswers>(() => {
    return getLocalStorage('userAnswers') || {}
  })
  const [submitted, setSubmitted] = useState(() => {
    return getLocalStorage('quizSubmitted') || false
  })
  const [score, setScore] = useState<number | null>(() => {
    return getLocalStorage('quizScore') || null
  })

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showReview, setShowReview] = useState(false)
  const questionsRef = useRef<HTMLDivElement>(null)

  // Navigation state
  const currentQuestion = questions[currentQuestionIndex]
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  // Add state for evaluation results
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResults>({});

  // Add loading state for evaluation
  const [evaluating, setEvaluating] = useState(false)

  // Load or shuffle questions
  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      // In your real code, you'd do your own formatting logic here
      const formattedQuestions = questionsData.map(q => {
        const choices: Choice[] = [
          ...q.answers.map(answer => ({ text: answer, is_correct: true })),
          ...q.incorrect_answers.map(answer => ({ text: answer, is_correct: false }))
        ]
        const selectionRule = q.answers.length === 1 ? "single_correct" : "multiple_correct"
        const minRequiredChoices = Math.max(4, q.answers.length)
        
        const openTextMode: OpenTextMode = { type: "open_text" }
        const multipleChoiceMode: MultipleChoiceMode = {
          type: "multiple_choice",
          selection_rule: selectionRule,
          randomize_choices: true,
          num_choices: Math.min(minRequiredChoices, choices.length)
        }
        return new Question(
          q.question_number.toString(),
          q.question_text,
          [openTextMode, multipleChoiceMode],
          choices,
          q.hint
        )
      })

      if (mode === 'sample') {
        const shuffled = [...formattedQuestions].sort(() => Math.random() - 0.5)
        setQuestions(shuffled.slice(0, 5))
      } else {
        setQuestions(formattedQuestions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [mode])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  // Persist user data & quiz results in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userAnswers', JSON.stringify(userAnswers))
      localStorage.setItem('quizSubmitted', JSON.stringify(submitted))
      if (score !== null) {
        localStorage.setItem('quizScore', JSON.stringify(score))
      }
    }
  }, [userAnswers, submitted, score])

  // Evaluate answers (with artificial delay for testing)
  const evaluateAnswers = async () => {
    try {
      // Optional: Add artificial delay for testing
      // await new Promise(resolve => setTimeout(resolve, 3000))

      if (!isMultipleChoice) {
        // If open-text (answerType = 'open'), do your custom check
        const openTextAnswers = questions.map(question => ({
          question_text: question.text,
          user_answer: userAnswers[question.id] as string,
          correct_answers: question.choices
            .filter(choice => choice.is_correct)
            .map(choice => choice.text),
        }))

        const response = await fetch('/api/evaluateQuiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(openTextAnswers),
        })

        if (!response.ok) {
          throw new Error('Failed to evaluate quiz')
        }

        const evaluations = await response.json()
        const results: EvaluationResults = {}

        evaluations.forEach((entry: any) => {
          const question = questions.find(q => q.text === entry.question_text)
          if (question) {
            results[question.id] = {
              is_correct: entry.is_correct,
              explanation:
                entry.explanation ||
                (entry.is_correct ? "Correct answer" : "Incorrect answer")
            }
          }
        })

        setEvaluationResults(results)
        const correctCount = Object.values(results).filter(r => r.is_correct).length
        setScore((correctCount / questions.length) * 100)
        setSubmitted(true)

      } else {
        // Multiple-choice evaluation
        const results: EvaluationResults = {}
        questions.forEach(question => {
          const userAnswer = userAnswers[question.id]
          const isCorrect = question.evaluateAnswer(userAnswer, true)
          results[question.id] = {
            is_correct: isCorrect,
            explanation: isCorrect ? "Correct answer selected" : "Incorrect answer selected",
          }
        })

        setEvaluationResults(results)
        const correctCount = Object.values(results).filter(r => r.is_correct).length
        setScore((correctCount / questions.length) * 100)
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error evaluating quiz:', error)
      alert('Failed to evaluate quiz. Please try again.')
    }
  }

  /**
   * Single place to handle “Start evaluation, set loading,
   * then finish evaluation” logic.
   */
  const handleEvaluate = async () => {
    setEvaluating(true)
    try {
      await evaluateAnswers()
    } finally {
      setEvaluating(false)
    }
  }

  // Handle user answers
  const handleAnswerChange = (questionId: string, choiceText: string, isMultipleCorrect: boolean) => {
    setUserAnswers(prev => {
      const currentAnswers = prev[questionId] || []
      if (isMultipleCorrect) {
        // For multiple-correct checkboxes, toggle the answer
        return {
          ...prev,
          [questionId]: Array.isArray(currentAnswers)
            ? currentAnswers.includes(choiceText)
              ? currentAnswers.filter(a => a !== choiceText)
              : [...currentAnswers, choiceText]
            : [choiceText],
        }
      } else {
        // Single correct: store array with one item
        return { ...prev, [questionId]: [choiceText] }
      }
    })
  }

  const handleTextAnswerChange = (questionId: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: value }))

    // Optional: find potential autocomplete match
    const question = questions.find(q => q.id === questionId)
    if (question) {
      const correctAnswers = question.choices
        .filter(choice => choice.is_correct)
        .map(choice => choice.text)

      const match = findPartialMatch(value, correctAnswers)
      setAutoCompleteMatch(match)
    }
  }

  // Navigation
  const goToNextQuestion = () => {
    if (!isLastQuestion) setCurrentQuestionIndex(i => i + 1)
  }

  const goToPreviousQuestion = () => {
    if (!isFirstQuestion) setCurrentQuestionIndex(i => i - 1)
  }

  // Clear quiz
  const clearQuiz = useCallback(() => {
    setUserAnswers({})
    setSubmitted(false)
    setScore(null)
    setCurrentQuestionIndex(0)
    setShowReview(false)
    setSkippedQuestions([])
    setShowingSkipped(false)

    localStorage.removeItem('userAnswers')
    localStorage.removeItem('quizSubmitted')
    localStorage.removeItem('quizScore')

    // Reload fresh questions
    loadQuestions()
  }, [loadQuestions])

  // Partial match for open-text (autocomplete)
  const findPartialMatch = (input: string, possibleAnswers: string[]): string | null => {
    const normalized = input.toLowerCase().trim()
    if (!normalized) return null

    for (const ans of possibleAnswers) {
      const normalizedAns = ans.toLowerCase()
      if (normalizedAns.startsWith(normalized) && normalized !== normalizedAns) {
        return ans
      }
    }
    return null
  }

  const handleQuestionKeyPress = useCallback(
    (questionId: string) => {
      // Skip if no answer provided
      const val = userAnswers[questionId]
      const isEmpty =
        !val ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === 'string' && !val.trim())

      if (isEmpty) {
        handleSkipQuestion(questionId, true)
      } else if (!isLastQuestion) {
        goToNextQuestion()
      }
    },
    [userAnswers, isLastQuestion]
  )

  // Skipping
  const [skippedQuestions, setSkippedQuestions] = useState<string[]>([])
  const [showingSkipped, setShowingSkipped] = useState(false)

  const handleSkipQuestion = (questionId: string, goNext: boolean = false) => {
    setSkippedQuestions(prev =>
      prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
    )

    if (goNext && isPaginatedView && !isLastQuestion) {
      goToNextQuestion()
    }
  }

  useEffect(() => {
    const savedSkipped = getLocalStorage('skippedQuestions')
    if (savedSkipped) {
      setSkippedQuestions(savedSkipped)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('skippedQuestions', JSON.stringify(skippedQuestions))
  }, [skippedQuestions])

  // Review
  const handleReviewClick = () => {
    setShowReview(true)
    questionsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  const handleReviewSkipped = () => {
    setShowingSkipped(true)
    setShowReview(true)
    questionsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Common props for <QuestionComponent />
  const [autoCompleteMatch, setAutoCompleteMatch] = useState<string | null>(null)

  const commonQuestionProps = {
    isMultipleChoice,
    submitted,
    userAnswers,
    handleAnswerChange,
    handleTextAnswerChange,
    handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, questionId: string) => {
      if (e.key === 'Tab' && autoCompleteMatch) {
        e.preventDefault()
        handleTextAnswerChange(questionId, autoCompleteMatch)
        setAutoCompleteMatch(null)
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleQuestionKeyPress(questionId)
      }
    },
    autoCompleteMatch,
    onSkipQuestion: handleSkipQuestion,
    skippedQuestions,
  }

  // Render a list of questions + optional Submit button
  const renderQuestionList = (
    theseQuestions: Question[],
    showSubmit: boolean = false
  ) => (
    <div className="space-y-4 mx-20 mb-6">
      {theseQuestions.map(question => (
        <QuestionComponent
          key={question.id}
          {...commonQuestionProps}
          question={question}
          showCorrectAnswers={!isMultipleChoice && submitted}
          correctAnswers={question.choices.filter(c => c.is_correct).map(c => c.text)}
          evaluationResult={evaluationResults[question.id]}
        />
      ))}

      {showSubmit && !submitted && (
        <div className="flex flex-col items-center mt-8 space-y-2">
          {/* Single place to call handleEvaluate */}
          <Button
            onClick={handleEvaluate}
            className="bg-[#f45844] hover:bg-[#f45844]/90 text-white"
            disabled={evaluating}
          >
            {evaluating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Evaluating answers...
              </>
            ) : (
              'Submit Quiz'
            )}
          </Button>
          {evaluating && (
            <p className="text-sm text-gray-600">
              This may take a moment as we carefully evaluate your answers
            </p>
          )}
        </div>
      )}
    </div>
  )

  const renderQuestions = () => {
    const questionsToDisplay = showingSkipped
      ? questions.filter(q => skippedQuestions.includes(q.id))
      : questions

    if (loading) return <div>Loading questions...</div>
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!questionsToDisplay.length) return <div>No questions available.</div>

    // If not submitted yet
    if (!submitted) {
      // Paginated mode
      if (isPaginatedView && currentQuestion) {
        return (
          <>
            <QuestionComponent
              key={currentQuestion.id}
              {...commonQuestionProps}
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              evaluationResult={evaluationResults[currentQuestion.id]}
            />
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={goToPreviousQuestion}
                disabled={isFirstQuestion}
                variant="outline"
                className={isFirstQuestion ? 'invisible' : ''}
              >
                ← Previous
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleEvaluate}
                  className="bg-[#f45844] hover:bg-[#f45844]/90 text-white"
                  disabled={evaluating}
                >
                  {evaluating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Evaluating answers...
                    </>
                  ) : (
                    'Submit Quiz'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={goToNextQuestion}
                  disabled={isLastQuestion}
                  variant="outline"
                  className={isLastQuestion ? 'invisible' : ''}
                >
                  Next →
                </Button>
              )}
            </div>
          </>
        )
      }

      // Non-paginated mode
      return renderQuestionList(questionsToDisplay, true)
    }

    // If submitted and user chooses to "review"
    return showReview ? renderQuestionList(questionsToDisplay) : null
  }

  return (
    <main className="container mx-auto p-4 pt-20">
      {/* e.g. Show question count */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {questions.length} question
        {questions.length !== 1 ? 's' : ''}
      </div>

      {submitted && score !== null && questions.length > 0 && (
        <Review
          score={score}
          totalQuestions={questions.length}
          mode={mode}
          onClearQuiz={clearQuiz}
          onReviewClick={handleReviewClick}
          skippedQuestions={skippedQuestions}
          onReviewSkipped={handleReviewSkipped}
        />
      )}

      <div ref={questionsRef}>{renderQuestions()}</div>
    </main>
  )
}
