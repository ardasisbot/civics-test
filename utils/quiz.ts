// Local storage helper
export const getLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }
  return null
}

// Answer evaluation helper
export const isDefinitelyCorrect = (userAnswer: string, correctAnswers: string[]): boolean => {
  return correctAnswers.some(answer => 
    answer.toLowerCase() === userAnswer?.toLowerCase()
  )
}

// Autocomplete helper
export const findPartialMatch = (input: string, possibleAnswers: string[]): string | null => {
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