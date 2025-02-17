'use client';

import { useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Question } from '@/components/Question';
import { Review } from '@/components/Review';
import { useQuizParams } from '@/hooks/useQuizParams';
import { useQuiz } from '@/hooks/useQuizState'; // import the hook we created
import { Question as QuestionType } from '@/types/question';

export default function Test() {
  const searchParams = useSearchParams();
  const quizParams = useQuizParams(searchParams);

  const {
    questions,
    userAnswers,
    submitted,
    score,
    loading,
    error,
    currentQuestionIndex,
    showReview,
    evaluationResults,
    evaluating,
    skippedQuestions,
    showingSkipped,
    autoCompleteMatch,

    // Actions
    handleAnswerChange,
    handleTextAnswerChange,
    handleEvaluate,
    goToNextQuestion,
    goToPreviousQuestion,
    clearQuiz,
    handleSkipQuestion,
    handleQuestionKeyPress,
    handleReviewClick,
    handleReviewSkipped,
  } = useQuiz(quizParams);

  // Derived
  const isMultipleChoice = quizParams.answerType === 'easy';
  const isPaginatedView = quizParams.view === 'paginated';

  const questionsRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    questionId: string
  ) => {
    if (e.key === 'Tab' && autoCompleteMatch) {
      e.preventDefault();
      handleTextAnswerChange(questionId, autoCompleteMatch);
    }
  };

  // Common props for QuestionComponent
  const commonQuestionProps = {
    isMultipleChoice,
    submitted,
    userAnswers,
    handleAnswerChangeAction: handleAnswerChange,
    handleTextAnswerChangeAction: handleTextAnswerChange,
    onQuestionKeyPressAction: handleQuestionKeyPress,
    handleKeyDownAction: handleKeyDown,
    autoCompleteMatch,
    onSkipQuestion: handleSkipQuestion,
    skippedQuestions,
  };

  // Reusable renderer for question list
  const renderQuestionList = (theseQuestions: QuestionType[], showSubmit: boolean) => (
    <div className="space-y-4 w-full">
      {theseQuestions.map((question) => (
        <Question
          key={question.id}
          {...commonQuestionProps}
          question={question}
          showCorrectAnswers={!isMultipleChoice && submitted}
          correctAnswers={question.choices.filter((c) => c.is_correct).map((c) => c.text)}
          evaluationResult={evaluationResults[question.id]}
        />
      ))}
      {showSubmit && !submitted && (
        <div className="flex flex-col items-center mt-8 space-y-2">
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
        </div>
      )}
    </div>
  );

  // Decide which questions to show (normal vs skipped)
  const displayedQuestions = showingSkipped
    ? questions.filter((q) => skippedQuestions.includes(q.id))
    : questions;

  // Main quiz rendering logic
  const renderQuestions = () => {
    if (loading) return <div>Loading questions...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;
    if (!displayedQuestions.length) return <div>No questions available.</div>;

    // Not submitted yet
    if (!submitted) {
      // Paginated mode
      if (isPaginatedView && currentQuestion) {
        return (
          <>
            <Question
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
        );
      }

      // Non-paginated mode
      return renderQuestionList(displayedQuestions, true);
    }

    // Submitted => show review if requested
    return showReview ? renderQuestionList(displayedQuestions, false) : null;
  };

  return (
    <main className="container mx-auto p-2 sm:p-4 pt-10 max-w-[1200px]">
      <div className="hidden sm:block text-sm text-gray-600 mb-4 px-2 sm:px-0">
        Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
      </div>

      {submitted && score !== null && questions.length > 0 && (
        <Review
          score={score}
          totalQuestions={questions.length}
          mode={quizParams.mode}
          onClearQuiz={clearQuiz}
          onReviewClick={handleReviewClick}
          skippedQuestions={skippedQuestions}
          onReviewSkipped={handleReviewSkipped}
        />
      )}

      <div ref={questionsRef} className="w-full max-w-4xl mx-auto px-1 sm:px-1 lg:px-8">
        {renderQuestions()}
      </div>
    </main>
  );
}
