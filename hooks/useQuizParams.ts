import { ReadonlyURLSearchParams } from 'next/navigation'

type QuizMode = 'sample' | 'full' 
type ViewMode = 'paginated' | 'continuous'
type AnswerType = 'easy' | 'hard'

export function useQuizParams(searchParams: ReadonlyURLSearchParams) {
  const mode = (searchParams.get('mode') as QuizMode) || 'sample'
  const view = (searchParams.get('view') as ViewMode) || 'paginated'
  const answerType = (searchParams.get('answerType') as AnswerType) || 'easy'

  return {
    mode,
    view,
    answerType
  } as const
} 