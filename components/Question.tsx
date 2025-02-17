"use client"
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Question as QuestionType } from '@/types/question';
import { MultipleChoiceMode } from '@/types/question';
import { Card, CardTitle, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";


// Define the evaluation result type once
type EvaluationResult = {
  is_correct: boolean;
  explanation?: string;  // Make explanation optional
}

interface BaseQuestionProps {
  question: QuestionType
  submitted: boolean
  questionNumber?: number
  totalQuestions?: number
  onSkipQuestion?: (questionId: string, goToNext?: boolean) => void
  skippedQuestions?: string[]
  evaluationResult?: EvaluationResult
}

interface QuestionProps extends BaseQuestionProps {
  isMultipleChoice: boolean
  userAnswers: { [key: string]: string[] | string }
  handleAnswerChangeAction: (questionId: string, choiceText: string, isMultipleCorrect: boolean) => void
  handleTextAnswerChangeAction: (questionId: string, value: string) => void
  handleKeyDownAction: (e: React.KeyboardEvent<HTMLElement>, questionId: string) => void
  onQuestionKeyPressAction: (questionId: string) => void
  autoCompleteMatch: string | null
  showCorrectAnswers?: boolean
  correctAnswers?: string[]
}

interface MultipleChoiceQuestionProps {
  question: QuestionType
  userAnswers: { [key: string]: string[] }
  handleAnswerChange: (questionId: string, choiceText: string, isMultipleCorrect: boolean) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, questionId: string) => void
  submitted: boolean
  isAnswerShown: boolean
}

// Remove evaluationResult from OpenTextQuestionProps since it's included in BaseQuestionProps
interface OpenTextQuestionProps extends BaseQuestionProps {
  userAnswerText: string
  handleTextAnswerChange: (questionId: string, value: string) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, questionId: string) => void
  onQuestionKeyPress: (questionId: string) => void
  autoCompleteMatch: string | null
  correctAnswers: string[]
  showCorrectAnswers?: boolean
}

export function Question({
  question,
  isMultipleChoice,
  submitted,
  userAnswers,
  handleAnswerChangeAction,
  handleTextAnswerChangeAction,
  handleKeyDownAction,
  onQuestionKeyPressAction,
  autoCompleteMatch,
  questionNumber,
  totalQuestions,
  onSkipQuestion,
  skippedQuestions = [],
  evaluationResult,
  showCorrectAnswers,
  correctAnswers,
}: QuestionProps) {
  const [isHintShown, setIsHintShown] = useState(false);
  const [isAnswerShown, setIsAnswerShown] = useState(false);

  useEffect(() => {
    if (submitted) {
      console.log(`Question ${question.id} evaluation:`, {
        submitted,
        evaluationResult,
        userAnswer: userAnswers[question.id],
        correctAnswers: question.choices.filter(c => c.is_correct).map(c => c.text),
      });
    }
  }, [submitted, evaluationResult, question.id, userAnswers, question.choices]);

  // Handle keyboard events at the Card level only for multiple choice
  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (isMultipleChoice && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onQuestionKeyPressAction(question.id)
    }
  }

  const renderAnswers = () => {
    if (isMultipleChoice) {
      return (
        <MultipleChoiceQuestion
          question={question}
          userAnswers={userAnswers as { [key: string]: string[] }}
          handleAnswerChange={handleAnswerChangeAction}
          handleKeyDown={handleKeyDownAction}
          submitted={submitted}
          isAnswerShown={isAnswerShown}
        />
      );
    }

    return (
      <OpenTextQuestion
        question={question}
        userAnswerText={userAnswers[question.id] as string}
        handleTextAnswerChange={handleTextAnswerChangeAction}
        handleKeyDown={handleKeyDownAction}
        onQuestionKeyPress={onQuestionKeyPressAction}
        submitted={submitted}
        autoCompleteMatch={autoCompleteMatch}
        correctAnswers={question.choices.filter(c => c.is_correct).map(c => c.text)}
        showCorrectAnswers={showCorrectAnswers}
      />
    );
  };

  return (
    <Card 
      className="w-full bg-[#faf9f7] border-2 shadow-lg mx-1 p-5 sm:p-6"
      onKeyDown={handleCardKeyDown}
      tabIndex={0}
    >
      <CardHeader className="pb-0 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm">
          <div className="flex items-center justify-between ">
            <div className="flex items-center gap-2">
              <Image
                src="/us_flag_icon.png"
                alt="US Flag"
                width={20}
                height={20}
                className="object-contain"
              />
              <span className="text-zinc-600">U.S. Civics Test</span>
              
            </div>
            {questionNumber && totalQuestions && (
            <span className="text-zinc-600 sm:hidden">
              {questionNumber} of {totalQuestions}
            </span>
            
          )}
          <div className="sm:hidden">
          {submitted && evaluationResult && (
              <Badge className={
                evaluationResult.is_correct 
                  ? "bg-green-600 text-white hover:bg-green-700" 
                  : "bg-red-500 text-white hover:bg-red-600"
              }>
                {evaluationResult.is_correct ? "Correct" : "Incorrect"}
              </Badge>
            )}
            </div>
          </div>
          <div/>
          {questionNumber && totalQuestions && (
            <span className="text-zinc-600 hidden sm:block">
              Question {questionNumber} of {totalQuestions}
            </span>
          )}
          <div className="flex flex-wrap gap-2 justify-end hidden sm:block">
            {submitted && evaluationResult && (
              <Badge className={
                evaluationResult.is_correct 
                  ? "bg-green-600 text-white hover:bg-green-700" 
                  : "bg-red-500 text-white hover:bg-red-600"
              }>
                {evaluationResult.is_correct ? "Correct" : "Incorrect"}
              </Badge>
            )}
            <div className="flex flex-wrap gap-2 pb-5 sm:pb-0">
              {!submitted && question.hint && (
                <Button onClick={() => setIsHintShown(!isHintShown)} variant="outline" size="sm">
                  {isHintShown ? "Hide Hint" : "Show Hint"}
                </Button>
              )}
              {!submitted && (
                <>
                  <Button
                    onClick={() => setIsAnswerShown(!isAnswerShown)}
                    variant="outline"
                    size="sm"
                    className="text-[#f45844] hover:text-[#f45844]/90"
                  >
                    {isAnswerShown ? "Hide Answer" : "Show Answer"}
                  </Button>
                  <Button
                    onClick={() => onSkipQuestion?.(question.id, true)}
                    variant="outline"
                    size="sm"
                    className={skippedQuestions.includes(question.id) ? "bg-yellow-50" : ""}
                  >
                    {skippedQuestions.includes(question.id) ? "Skipped" : "Skip"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>


      <CardContent className="space-y-8">

        <p className="text-lg font-medium text-zinc-800 pb-0 sm:pb-6">{question.text}</p>

        {isHintShown && question.hint && (
          <div className="flex items-start p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-md">
            <span className="mr-2">💡</span>
            <p className="text-sm text-zinc-600">{question.hint}</p>
          </div>
        )}

        {!isMultipleChoice && submitted && evaluationResult && (
          <div className={`p-2 rounded-md text-sm font-medium ${
            evaluationResult.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {evaluationResult.is_correct ? '✓ Correct' : '✗ Incorrect'}
            {evaluationResult.explanation && <p className="text-gray-600 mt-1">{evaluationResult.explanation}</p>}
          </div>
        )}

        {isAnswerShown && !submitted && (
          <div className="p-3 bg-[#fff5f4] border border-[#f45844]/20 rounded-md">
            <p className="font-medium text-[#f45844]">Correct Answer(s):</p>
            
            <ul className="list-disc pl-5 text-sm text-[#f45844]">
              {question.choices.filter(c => c.is_correct).map((choice, index) => (
                <li key={index}>{choice.text}</li>
              ))}
            </ul>
          </div>
        )}

        {renderAnswers()}
         
      </CardContent>
     
    </Card>
  );
}

function MultipleChoiceQuestion({ 
  question, 
  userAnswers, 
  handleAnswerChange, 
  handleKeyDown, 
  submitted, 
  isAnswerShown 
}: MultipleChoiceQuestionProps) {
  const mode = question.modes.find((m) => m.type === "multiple_choice") as MultipleChoiceMode
  const choices = question.getFilteredChoices(mode)
  const isMultipleCorrect = mode.selection_rule === "multiple_correct"
  const questionAnswers = userAnswers[question.id] || []

  const [shuffledChoices] = useState(() => {
    return [...choices].sort(() => Math.random() - 0.5)
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
      {shuffledChoices.length === 1 ? (
        <div className="col-span-full sm:col-span-2 mx-auto">
          <div
            key={0}
            className={`relative flex items-center p-2 sm:p-4 rounded-lg border-4 transition-colors ${
              questionAnswers.includes(shuffledChoices[0].text) ? "border-[#f45844] bg-[#f45844]/5" :
              submitted && shuffledChoices[0].is_correct ? "border-green-500 bg-green-50" :
              "border-zinc-200 hover:border-[#f45844] hover:bg-[#f45844]/5"
            } cursor-pointer`}
            onClick={() => handleAnswerChange(question.id, shuffledChoices[0].text, isMultipleCorrect)}
            role="button"
            tabIndex={0}
          >
            <input
              type="checkbox"
              id={`q${question.id}-0`}
              checked={questionAnswers.includes(shuffledChoices[0].text)}
              onChange={(e) => handleAnswerChange(question.id, shuffledChoices[0].text, isMultipleCorrect)}
              disabled={submitted}
              className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-zinc-300 group-hover:border-[#f45844] cursor-pointer"
            />
            <Label
              htmlFor={`q${question.id}-0`}
              className="pl-8 py-0 sm:py-2 text-sm font-medium text-zinc-700 cursor-pointer flex-grow select-none"
              onClick={(e) => {
                e.stopPropagation()
                handleAnswerChange(question.id, shuffledChoices[0].text, isMultipleCorrect)
              }}
            >
              {shuffledChoices[0].text}
            </Label>
          </div>
        </div>
      ) : (
        shuffledChoices.map((choice, index) => {
          const isSelected = questionAnswers.includes(choice.text)
          const showResult = submitted
          const isCorrect = choice.is_correct

          let styles = "border-zinc-200 hover:border-[#f45844] hover:bg-[#f45844]/5"
          if (isSelected) {
            styles = "border-[#f45844] bg-[#f45844]/5"
          }
          if (showResult && isCorrect) {
            styles = "border-green-500 bg-green-50"
          }

          const handleClick = () => {
            if (!submitted) {
              handleAnswerChange(question.id, choice.text, isMultipleCorrect)
            }
          }

          return (
            <div
              key={index}
              className={`relative flex items-center p-2 sm:p-4 rounded-lg border-4 transition-colors ${styles} cursor-pointer`}
              onClick={handleClick}
              role="button"
              tabIndex={0}
            >
              <input
                type="checkbox"
                id={`q${question.id}-${index}`}
                checked={isSelected}
                onChange={handleClick}
                disabled={submitted}
                className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-zinc-300 group-hover:border-[#f45844] cursor-pointer"
              />
              <Label
                htmlFor={`q${question.id}-${index}`}
                className="pl-8 py-0 sm:py-2 text-sm font-medium text-zinc-700 cursor-pointer flex-grow select-none"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
              >
                {choice.text}
              </Label>
            </div>
          )
        })
      )}
    </div>
  )
}

function OpenTextQuestion({
  question,
  userAnswerText = '',
  handleTextAnswerChange,
  handleKeyDown,
  onQuestionKeyPress,
  submitted,
  autoCompleteMatch,
  correctAnswers,
  showCorrectAnswers,
  evaluationResult,
}: OpenTextQuestionProps) {
  return (
    <div className="px-4">
      <Input
        type="text"
        value={userAnswerText || ''}
        onChange={(e) => handleTextAnswerChange(question.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()
            onQuestionKeyPress(question.id)
          } else {
            handleKeyDown(e, question.id)
          }
        }}
        disabled={submitted}
        className={`w-full p-4 border-2 rounded-lg focus:border-[#f45844] focus:ring-[#f45844] ${
          submitted && evaluationResult
            ? evaluationResult.is_correct
              ? 'border-green-500 bg-green-50'
              : 'border-red-500 bg-red-50'
            : 'border-zinc-200'
        }`}
      />
      {!submitted && autoCompleteMatch && (
        <div className="mt-2 p-2 bg-zinc-100 rounded-md">
          <p className="text-sm text-zinc-600">
            Press <kbd className="px-2 py-1 bg-white rounded">Tab</kbd> to complete: {autoCompleteMatch}
          </p>
        </div>
      )}

      {(showCorrectAnswers || !question.choices.some(choice => !choice.is_correct)) && (
        <div className="mt-4 p-4 bg-[#fff5f4] border border-[#f45844]/20 rounded-md">
          <div className="flex items-start">
            <span className="mr-2">✨</span>
            <div className="text-sm text-[#f45844]">
              <p className="font-medium mb-1">
                Correct Answer{correctAnswers.length > 1 ? 's' : ''}:
              </p>
              <ul className="list-disc pl-5">
                {correctAnswers.map((answer, index) => (
                  <li key={index}>{answer}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}