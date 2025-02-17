import { useState } from 'react'
import { Question } from '@/types/question'

export function useQuizNavigation(questions: Question[]) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showReview, setShowReview] = useState(false)
  const [showingSkipped, setShowingSkipped] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const goToNextQuestion = () => {
    if (!isLastQuestion) setCurrentQuestionIndex(i => i + 1)
  }

  const goToPreviousQuestion = () => {
    if (!isFirstQuestion) setCurrentQuestionIndex(i => i - 1)
  }

  return {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    showReview,
    setShowReview,
    showingSkipped,
    setShowingSkipped,
    currentQuestion,
    isFirstQuestion,
    isLastQuestion,
    goToNextQuestion,
    goToPreviousQuestion
  }
} 