import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Question as QuestionType } from '@/types/question';
import { MultipleChoiceMode } from '@/types/question';
import { Card, CardTitle, CardHeader, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input"
import Image from 'next/image'
import { Badge } from "@/components/ui/badge"

// Add NUMBER_WORDS constant
const NUMBER_WORDS: { [key: string]: string } = {
  'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
  'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
  'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
  'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18',
  'nineteen': '19', 'twenty': '20', 'thirty': '30', 'forty': '40',
  'fifty': '50', 'sixty': '60', 'seventy': '70', 'eighty': '80',
  'ninety': '90'
};

// Add helper functions
const convertNumberWords = (text: string): string => {
  let result = text.toLowerCase();
  
  // Handle compound numbers (e.g., "twenty-seven", "thirty five")
  const compoundRegex = new RegExp(
    `(${Object.keys(NUMBER_WORDS).join('|')})[-\\s]+(${Object.keys(NUMBER_WORDS).join('|')})`,
    'gi'
  );
  
  result = result.replace(compoundRegex, (match, tens, ones) => {
    const tensNum = parseInt(NUMBER_WORDS[tens.toLowerCase()]);
    const onesNum = parseInt(NUMBER_WORDS[ones.toLowerCase()]);
    
    if (tensNum % 10 === 0 && tensNum <= 90) {
      return (tensNum + onesNum).toString();
    }
    return match;
  });

  // Handle single number words
  const singleRegex = new RegExp(`\\b(${Object.keys(NUMBER_WORDS).join('|')})\\b`, 'gi');
  result = result.replace(singleRegex, match => NUMBER_WORDS[match.toLowerCase()] || match);

  return result;
};

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    // Convert number words to digits
    .split(/\s+/)
    .map(word => convertNumberWords(word))
    .join(' ')
    // Remove parenthetical content and special characters
    .replace(/\([^)]*\)/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

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
  handleAnswerChange: (questionId: string, choiceText: string, isMultipleCorrect: boolean) => void
  handleTextAnswerChange: (questionId: string, value: string) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, questionId: string) => void
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
  autoCompleteMatch: string | null
  correctAnswers: string[]
  showCorrectAnswers?: boolean
}

export function Question({
  question,
  isMultipleChoice,
  submitted,
  userAnswers,
  handleAnswerChange,
  handleTextAnswerChange,
  handleKeyDown,
  autoCompleteMatch,
  questionNumber,
  totalQuestions,
  onSkipQuestion,
  skippedQuestions = [],
  evaluationResult,
  showCorrectAnswers,
  correctAnswers,
}: QuestionProps) {
  const [isHintShown, setIsHintShown] = useState(false)
  const [isAnswerShown, setIsAnswerShown] = useState(false)

  // Add logging
  useEffect(() => {
    if (submitted) {
      console.log(`Question ${question.id} evaluation:`, {
        submitted,
        evaluationResult,
        userAnswer: userAnswers[question.id],
        correctAnswers: question.choices.filter(c => c.is_correct).map(c => c.text)
      });
    }
  }, [submitted, evaluationResult, question.id, userAnswers, question.choices]);

  const renderAnswers = () => {
    if (isMultipleChoice) {
      return (
        <MultipleChoiceQuestion
          question={question}
          userAnswers={userAnswers as { [key: string]: string[] }}
          handleAnswerChange={handleAnswerChange}
          handleKeyDown={handleKeyDown}
          submitted={submitted}
          isAnswerShown={isAnswerShown}
        />
      )
    }

    return (
      <OpenTextQuestion
        question={question}
        userAnswerText={userAnswers[question.id] as string}
        handleTextAnswerChange={handleTextAnswerChange}
        handleKeyDown={handleKeyDown}
        submitted={submitted}
        autoCompleteMatch={autoCompleteMatch}
        correctAnswers={question.choices.filter(c => c.is_correct).map(c => c.text)}
        showCorrectAnswers={showCorrectAnswers}
      />
    )
  }

  return (
    <Card className="w-full bg-[#faf9f7] border-4 shadow-lg m-5 px-10 mx-10">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center gap-3 text-sm">
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
            <span className="text-zinc-600">
              Question {questionNumber} of {totalQuestions}
            </span>
          )}
          {submitted && evaluationResult && (
            <>
              {console.log('Rendering badge for question', question.id, 'with result:', evaluationResult)}
              <Badge className={
                evaluationResult.is_correct 
                  ? "bg-green-600 text-white hover:bg-green-700" 
                  : "bg-red-500 text-white hover:bg-red-600"
              }>
                {evaluationResult.is_correct ? "Correct" : "Incorrect"}
              </Badge>
            </>
          )}

          <div className="flex gap-2">
            {question.hint && (
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
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="space-y-4 px-4">
          <p className="text-lg font-medium leading-snug text-zinc-800">{question.text}</p>
          
          <div className="flex items-start min-h-[2rem]">
            {isHintShown && question.hint && (
              <>
                {console.log('Showing hint for question', question.id, ':', question.hint)}
                <span className="mr-2 mb-5">💡</span>
                <p className="text-sm text-zinc-600 italic">{question.hint}</p>
              </>
            )}
          </div>
          {submitted && evaluationResult && (
        <div className={`mt-2 p-2 rounded-md ${
          evaluationResult.is_correct ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <p className="text-sm font-medium">
            {evaluationResult.is_correct ? '✓ Correct' : '✗ Incorrect'}
          </p>
          {evaluationResult.explanation && (
            <>
              
              <p className="text-sm mt-1 text-gray-600">
                {evaluationResult.explanation}
              </p>
            </>
          )}
        </div>
      )}
          {isAnswerShown && !submitted && (
            <div className="p-3 bg-[#fff5f4] border border-[#f45844]/20 rounded-md">
              <div className="flex items-start">
                <span className="mr-2">✨</span>
                <div className="text-sm text-[#f45844]">
                  <p className="font-medium mb-1">
                    Correct Answer{question.choices.filter(c => c.is_correct).length > 1 ? 's' : ''}:
                  </p>
                  <ul className="list-disc pl-5">
                    {question.choices
                      .filter(choice => choice.is_correct)
                      .map((choice, index) => (
                        <li key={index}>{choice.text}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        {renderAnswers()}
      </CardContent>
    </Card>
  )
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
    <div 
      className="grid grid-cols-2 gap-4 px-4"
      onKeyDown={(e) => handleKeyDown(e, question.id)}
      tabIndex={0}
    >
      {/* {isMultipleCorrect && <p className="text-sm text-muted-foreground mt-2">Select all correct answers</p>} */}
      {shuffledChoices.map((choice, index) => {
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

        return (
          <div
            key={index}
            className={`relative flex items-center justify-center p-4 rounded-lg border-2 transition-colors ${styles}`}
            onClick={() => !submitted && handleAnswerChange(question.id, choice.text, isMultipleCorrect)}
          >
            <input
              type="checkbox"
              id={`q${question.id}-${index}`}
              checked={isSelected}
              onChange={() => {}}
              disabled={submitted}
              className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-zinc-300 group-hover:border-[#f45844]"
            />
            <Label
              htmlFor={`q${question.id}-${index}`}
              className="p-5 text-sm font-medium text-zinc-700 cursor-pointer"
            >
              {choice.text}
            </Label>
          </div>
        )
      })}
      
    </div>
  )
}

function OpenTextQuestion({
  question,
  userAnswerText = '',
  handleTextAnswerChange,
  handleKeyDown,
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
        onKeyDown={(e) => handleKeyDown(e, question.id)}
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

      {showCorrectAnswers && (
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
