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

// Add type for evaluation results
type EvaluationResults = {
  [questionId: string]: {
    is_correct: boolean;
    explanation?: string;
  };
};

// Constants for number word conversion
const NUMBER_WORDS: { [key: string]: string } = {
  'one': '1',
  'two': '2',
  'three': '3',
  'four': '4',
  'five': '5',
  'six': '6',
  'seven': '7',
  'eight': '8',
  'nine': '9',
  'ten': '10',
  'eleven': '11',
  'twelve': '12',
  'thirteen': '13',
  'fourteen': '14',
  'fifteen': '15',
  'sixteen': '16',
  'seventeen': '17',
  'eighteen': '18',
  'nineteen': '19',
  'twenty': '20',
  'thirty': '30',
  'forty': '40',
  'fifty': '50',
  'sixty': '60',
  'seventy': '70',
  'eighty': '80',
  'ninety': '90'
};

// Helper function to safely access localStorage
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

  const isFullTest = mode === 'full'
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
  const [autoCompleteMatch, setAutoCompleteMatch] = useState<string | null>(null)
  
  const [showReview, setShowReview] = useState(false)
  const questionsRef = useRef<HTMLDivElement>(null)

  // Navigation state
  const currentQuestion = questions[currentQuestionIndex]
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  // Add state for evaluation results
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResults>({});

  // Question loading
  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const formattedQuestions = questionsData.map(q => {
        const choices: Choice[] = [
          ...q.answers.map(answer => ({ text: answer, is_correct: true })),
          ...q.incorrect_answers.map(answer => ({ text: answer, is_correct: false }))
        ]

        const selectionRule = q.answers.length === 1 
          ? "single_correct" 
          : "multiple_correct"

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
        console.log('Questions:', shuffled.slice(0, 5))
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

  // Persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userAnswers', JSON.stringify(userAnswers))
      localStorage.setItem('quizSubmitted', JSON.stringify(submitted))
      if (score !== null) {
        localStorage.setItem('quizScore', JSON.stringify(score))
      }
    }
  }, [userAnswers, submitted, score])

  // Update evaluateAnswers function to store results
  const evaluateAnswers = async () => {
    try {
      if (!isMultipleChoice) {
        const openTextAnswers = questions.map(question => ({
          question_text: question.text,
          user_answer: userAnswers[question.id] as string,
          correct_answers: question.choices
            .filter(choice => choice.is_correct)
            .map(choice => choice.text),
        }));

        const response = await fetch('/api/evaluateQuiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(openTextAnswers),
        });

        if (!response.ok) {
          throw new Error('Failed to evaluate quiz');
        }

        const evaluations = await response.json();
        console.log('LLM Evaluations:', evaluations);

        // Store evaluation results
        const results: EvaluationResults = {};
        evaluations.forEach((entry: any) => {
          const question = questions.find(q => q.text === entry.question_text);
          if (question) {
            results[question.id] = {
              is_correct: entry.is_correct,
              explanation: entry.explanation || (entry.is_correct ? "Correct answer" : "Incorrect answer"),
            };
          }
        });
        setEvaluationResults(results);
        
        // Calculate score
        const correctCount = Object.values(results).filter(r => r.is_correct).length;
        const scorePercentage = (correctCount / questions.length) * 100;
        
        setScore(scorePercentage);
        setSubmitted(true);
      } else {
        // Handle multiple choice evaluation
        const results: EvaluationResults = {};
        questions.forEach(question => {
          const userAnswer = userAnswers[question.id];
          const isCorrect = question.evaluateAnswer(userAnswer, true);
          results[question.id] = {
            is_correct: isCorrect,
            explanation: isCorrect ? "Correct answer selected" : "Incorrect answer selected",
          };
        });

        setEvaluationResults(results);
        
        const correctCount = Object.values(results).filter(r => r.is_correct).length;
        const scorePercentage = (correctCount / questions.length) * 100;
        
        setScore(scorePercentage);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error evaluating quiz:', error);
      alert('Failed to evaluate quiz. Please try again.');
    }
  }

  // Answer handling
  const handleAnswerChange = (questionId: string, choiceText: string, isMultipleCorrect: boolean) => {
    setUserAnswers(prev => {
      const currentAnswers = prev[questionId] || []
      
      if (isMultipleCorrect) {
        // Toggle the answer for checkboxes
        return {
          ...prev,
          [questionId]: Array.isArray(currentAnswers) 
            ? currentAnswers.includes(choiceText)
              ? currentAnswers.filter(a => a !== choiceText)
              : [...currentAnswers, choiceText]
            : [choiceText]
        }
      } else {
        // Single answer for radio buttons
        return {
          ...prev,
          [questionId]: [choiceText]
        }
      }
    })
  }

  const handleTextAnswerChange = (questionId: string, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))

    // Find potential autocomplete match
    const question = questions.find(q => q.id === questionId)
    if (question) {
      const correctAnswers = question.choices
        .filter(choice => choice.is_correct)
        .map(choice => choice.text)
      
      const match = findPartialMatch(value, correctAnswers)
      setAutoCompleteMatch(match)
    }
  }
  // Modified skip handler to include navigation
  const handleSkipQuestion = (questionId: string, goToNext: boolean = false) => {
    setSkippedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId)
      }
      return [...prev, questionId]
    })

    // If goToNext is true and we're in paginated view, go to next question
    if (goToNext && isPaginatedView && !isLastQuestion) {
      goToNextQuestion()
    }
  }
  
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLElement>, 
    questionId: string
  ) => {
    if (e.key === 'Tab' && autoCompleteMatch) {
      e.preventDefault(); // Prevent default tab behavior
      handleTextAnswerChange(questionId, autoCompleteMatch);
      setAutoCompleteMatch(null);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuestionKeyPress(questionId);
    }
  }

  // Navigation
  const goToNextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const clearQuiz = useCallback(() => {
    setUserAnswers({})
    setSubmitted(false)
    setScore(null)
    setCurrentQuestionIndex(0)
    setShowReview(false)
    setSkippedQuestions([])
    setShowingSkipped(false)
    
    // Clear localStorage
    localStorage.removeItem('userAnswers')
    localStorage.removeItem('quizSubmitted')
    localStorage.removeItem('quizScore')

    // Reload questions after clearing
    loadQuestions()
  }, [loadQuestions])

  // Helper function for text matching
  const findPartialMatch = (input: string, possibleAnswers: string[]): string | null => {
    const normalizedInput = input.toLowerCase().trim()
    if (!normalizedInput) return null

    for (const answer of possibleAnswers) {
      const normalizedAnswer = answer.toLowerCase()
      if (normalizedAnswer.startsWith(normalizedInput) && normalizedInput !== normalizedAnswer) {
        return answer
      }
    }
    return null
  }
const handleQuestionKeyPress = useCallback((questionId: string) => {
    // Skip if no answer provided
    if (!userAnswers[questionId] || 
        (Array.isArray(userAnswers[questionId]) && userAnswers[questionId].length === 0) ||
        (typeof userAnswers[questionId] === 'string' && !userAnswers[questionId].trim())) {
      handleSkipQuestion(questionId, true);
    } else if (!isLastQuestion) {
      goToNextQuestion();
    }
  }, [userAnswers, handleSkipQuestion, isLastQuestion, goToNextQuestion]);

  const handleReviewClick = () => {
    setShowReview(true)
    questionsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const [skippedQuestions, setSkippedQuestions] = useState<string[]>([])
  const [showingSkipped, setShowingSkipped] = useState(false)

  // Load skipped questions from localStorage
  useEffect(() => {
    const savedSkipped = getLocalStorage('skippedQuestions')
    if (savedSkipped) {
      setSkippedQuestions(savedSkipped)
    }
  }, [])

  // Save skipped questions to localStorage
  useEffect(() => {
    localStorage.setItem('skippedQuestions', JSON.stringify(skippedQuestions))
  }, [skippedQuestions])



  // Handle reviewing skipped questions
  const handleReviewSkipped = () => {
    setShowingSkipped(true)
    setShowReview(true)
    questionsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const commonQuestionProps = {
    isMultipleChoice,
    submitted,
    userAnswers,
    handleAnswerChange,
    handleTextAnswerChange,
    handleKeyDown,
    autoCompleteMatch,
    onSkipQuestion: handleSkipQuestion,
    skippedQuestions,
    evaluationResult: currentQuestion ? evaluationResults[currentQuestion.id] : undefined,
  }

  const renderQuestionList = (questions: Question[], showSubmitButton: boolean = false) => (
    <div className="space-y-4 mx-20 mb-6">
      {questions.map(question => (
        <QuestionComponent
          key={question.id}
          {...commonQuestionProps}
          question={question}
          showCorrectAnswers={!isMultipleChoice && submitted}
          correctAnswers={question.choices
            .filter(choice => choice.is_correct)
            .map(choice => choice.text)
          }
          evaluationResult={evaluationResults[question.id]}
        />
      ))}
      {showSubmitButton && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => evaluateAnswers()}
            className="bg-[#f45844] hover:bg-[#f45844]/90 text-white"
          >
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );

  const renderQuestions = () => {
    // Filter questions based on review state
    const questionsToDisplay = showingSkipped 
      ? questions.filter(q => skippedQuestions.includes(q.id))
      : questions

    if (loading) {
      return <div>Loading questions...</div>
    }

    if (error) {
      return <div className="text-red-500">Error: {error}</div>
    }

    if (!questionsToDisplay.length) {
      return <div>No questions available.</div>
    }

    if (!submitted) {
      return (
        <>
          {isPaginatedView ? (
            currentQuestion && (
              <>
                {/* {console.log('Current Question:', currentQuestion)} */}
                <QuestionComponent
                  key={currentQuestion.id}
                  {...commonQuestionProps}
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
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
                      onClick={() => evaluateAnswers()}
                      className="bg-[#f45844] hover:bg-[#f45844]/90 text-white"
                    >
                      Submit Quiz
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
          ) : (
            renderQuestionList(questionsToDisplay, true)
          )}
        </>
      )
    }

    return showReview ? renderQuestionList(questionsToDisplay) : null;
  }

  return (
    <main className="container mx-auto p-4 pt-20">
      {/* Add test button at the top */}
    

      {/* Question count display */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
      </div>

      {/* Only show Review if we have questions */}
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

      <div ref={questionsRef}>
        {renderQuestions()}
      </div>
    </main>
  )
} 