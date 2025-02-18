import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizParams } from '@/hooks/useQuizParams';
import questionsData from '@/output/questions_with_hints.json';
import { Question, Choice, OpenTextMode, MultipleChoiceMode } from '@/types/question';
import { getLocalStorage, isDefinitelyCorrect, findPartialMatch } from '@/utils/quiz';

type UserAnswers = {
  [questionId: string]: string[] | string;
};

type EvaluationResults = {
  [questionId: string]: {
    is_correct: boolean;
    explanation?: string;
  };
};

interface UseQuizResult {
  questions: Question[];
  userAnswers: UserAnswers;
  submitted: boolean;
  score: number | null;
  loading: boolean;
  error: string | null;
  currentQuestionIndex: number;
  showReview: boolean;
  evaluationResults: EvaluationResults;
  evaluating: boolean;
  skippedQuestions: string[];
  showingSkipped: boolean;
  autoCompleteMatch: string | null;

  // Action methods
  loadQuestions: () => Promise<void>;
  handleAnswerChange: (questionId: string, choiceText: string, isMultipleCorrect: boolean) => void;
  handleTextAnswerChange: (questionId: string, value: string) => void;
  handleEvaluate: () => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  clearQuiz: () => void;
  handleSkipQuestion: (questionId: string, goNext?: boolean) => void;
  handleQuestionKeyPress: (questionId: string) => void;
  handleReviewClick: () => void;
  handleReviewSkipped: () => void;
}

export function useQuiz(searchParams: ReturnType<typeof useQuizParams>): UseQuizResult {
  const { mode, view, answerType } = searchParams;
  const router = useRouter();
  const isPaginatedView = view === 'paginated';
  const isMultipleChoice = answerType === 'easy';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>(() => getLocalStorage('userAnswers') || {});
  const [submitted, setSubmitted] = useState<boolean>(() => getLocalStorage('quizSubmitted') || false);
  const [score, setScore] = useState<number | null>(() => getLocalStorage('quizScore') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResults>({});
  const [evaluating, setEvaluating] = useState(false);
  const [skippedQuestions, setSkippedQuestions] = useState<string[]>(() => getLocalStorage('skippedQuestions') || []);
  const [showingSkipped, setShowingSkipped] = useState(false);
  const [autoCompleteMatch, setAutoCompleteMatch] = useState<string | null>(null);

  // Load or shuffle questions
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setShowReview(false);
    try {
      const formattedQuestions = questionsData.map((q) => {
        const choices: Choice[] = [
          ...q.answers.map((answer: string) => ({ text: answer, is_correct: true })),
          ...q.incorrect_answers.map((answer: string) => ({ text: answer, is_correct: false })),
        ];
        const selectionRule = q.answers.length === 1 ? 'single_correct' : 'multiple_correct';
        const minRequiredChoices = Math.max(4, q.answers.length);

        const openTextMode: OpenTextMode = { type: 'open_text' };
        const multipleChoiceMode: MultipleChoiceMode = {
          type: 'multiple_choice',
          selection_rule: selectionRule,
          randomize_choices: true,
          num_choices: Math.min(minRequiredChoices, choices.length),
        };

        return new Question(
          q.question_number.toString(),
          q.question_text,
          [openTextMode, multipleChoiceMode],
          choices,
          q.hint
        );
      });

      if (mode === 'sample') {
        const shuffled = [...formattedQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, 5));
      } else {
        setQuestions(formattedQuestions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Persist user data & quiz results in localStorage
  useEffect(() => {
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    localStorage.setItem('quizSubmitted', JSON.stringify(submitted));
    if (score !== null) {
      localStorage.setItem('quizScore', JSON.stringify(score));
    }
    localStorage.setItem('skippedQuestions', JSON.stringify(skippedQuestions));
  }, [userAnswers, submitted, score, skippedQuestions]);

  // Evaluate answers (called internally by handleEvaluate)
  const evaluateAnswers = async () => {
    if (!questions.length) return;

    try {
      if (!isMultipleChoice) {
        const results: EvaluationResults = {};
        const needsEvaluation: any[] = [];

        // First pass: check for definite correct answers
        questions.forEach((question) => {
          const userAnswer = userAnswers[question.id] as string;
          const correctAnswers = question.choices.filter((c) => c.is_correct).map((c) => c.text);
          const hasIncorrectAnswers = question.choices.some((c) => !c.is_correct);

          if (isDefinitelyCorrect(userAnswer, correctAnswers) || !hasIncorrectAnswers) {
            results[question.id] = {
              is_correct: true,
              explanation: 'Correct answer',
            };
          } else {
            needsEvaluation.push({
              question_text: question.text,
              user_answer: userAnswer,
              correct_answers: correctAnswers,
            });
          }
        });

        // Only call API for the uncertain ones
        if (needsEvaluation.length > 0) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
          const response = await fetch(`${apiUrl}/evaluateQuiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(needsEvaluation),
          });

          if (!response.ok) {
            throw new Error('Failed to evaluate quiz');
          }

          const evaluations = await response.json();
          evaluations.forEach((entry: any) => {
            const question = questions.find((q) => q.text === entry.question_text);
            if (question) {
              results[question.id] = {
                is_correct: entry.is_correct,
                explanation:
                  entry.explanation || (entry.is_correct ? 'Correct answer' : 'Incorrect answer'),
              };
            }
          });
        }

        setEvaluationResults(results);
        const correctCount = Object.values(results).filter((r) => r.is_correct).length;
        setScore((correctCount / questions.length) * 100);
        setSubmitted(true);
      } else {
        // Multiple choice
        const results: EvaluationResults = {};
        questions.forEach((question) => {
          const userAnswer = userAnswers[question.id];
          const isCorrect = question.evaluateAnswer(userAnswer, true);
          results[question.id] = {
            is_correct: isCorrect,
            explanation: isCorrect ? 'Correct answer selected' : 'Incorrect answer selected',
          };
        });
        setEvaluationResults(results);
        const correctCount = Object.values(results).filter((r) => r.is_correct).length;
        setScore((correctCount / questions.length) * 100);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error evaluating quiz:', error);
      alert('Failed to evaluate quiz. Please try again.');
    }
  };

  // Public method to start evaluation (sets evaluating UI state, etc.)
  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await evaluateAnswers();
    } finally {
      setEvaluating(false);
    }
  };

  // Handle user answers
  const handleAnswerChange = useCallback(
    (questionId: string, choiceText: string, isMultipleCorrect: boolean) => {
      setUserAnswers((prev) => {
        const currentAnswers = prev[questionId] || [];
        if (isMultipleCorrect) {
          return {
            ...prev,
            [questionId]: Array.isArray(currentAnswers)
              ? currentAnswers.includes(choiceText)
                ? currentAnswers.filter((a) => a !== choiceText)
                : [...currentAnswers, choiceText]
              : [choiceText],
          };
        } else {
          return { ...prev, [questionId]: [choiceText] };
        }
      });
    },
    []
  );

  const handleTextAnswerChange = useCallback(
    (questionId: string, value: string) => {
      setUserAnswers((prev) => ({ ...prev, [questionId]: value }));
      // Optional partial match for hints
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        const correctAnswers = question.choices.filter((c) => c.is_correct).map((c) => c.text);
        const match = findPartialMatch(value, correctAnswers);
        setAutoCompleteMatch(match);
      }
    },
    [questions]
  );

  // Navigation
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    }
  }, [currentQuestionIndex]);

  // Clear quiz
  const clearQuiz = useCallback(() => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(null);
    setCurrentQuestionIndex(0);
    setShowReview(false);
    setSkippedQuestions([]);
    setShowingSkipped(false);
    loadQuestions();
  }, [loadQuestions]);

  // Skipping
  const handleSkipQuestion = useCallback(
    (questionId: string, goNext: boolean = false) => {
      setSkippedQuestions((prev) =>
        prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
      );

      if (goNext && isPaginatedView && currentQuestionIndex < questions.length - 1) {
        goToNextQuestion();
      }
    },
    [goToNextQuestion, currentQuestionIndex, isPaginatedView, questions.length]
  );

  const handleQuestionKeyPress = useCallback(
    (questionId: string) => {
      const val = userAnswers[questionId];
      const isEmpty =
        !val ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === 'string' && !val.trim());
      if (isEmpty) {
        handleSkipQuestion(questionId, true);
      } else if (currentQuestionIndex < questions.length - 1) {
        goToNextQuestion();
      }
    },
    [userAnswers, currentQuestionIndex, questions.length, handleSkipQuestion, goToNextQuestion]
  );

  // Review
  const handleReviewClick = () => {
    setShowReview(true);
  };

  const handleReviewSkipped = () => {
    setShowingSkipped(true);
    setShowReview(true);
  };

  return {
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
    loadQuestions,
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
  };
}
