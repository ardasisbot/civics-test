import { NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

interface QuizAnswer {
  question_text: string
  user_answer: string
  correct_answers: string[]
}

export async function POST(request: Request) {
  try {
    const answers: QuizAnswer[] = await request.json()

    // Split answers into chunks of 50
    const chunkSize = 50
    const answerChunks = []
    for (let i = 0; i < answers.length; i += chunkSize) {
      answerChunks.push(answers.slice(i, i + chunkSize))
    }

    // Process each chunk and combine results
    const allEvaluations = []
    for (const chunk of answerChunks) {
      const model = google('gemini-2.0-flash-lite-preview-02-05')
      
      const prompt = `You are an expert evaluator for US Civics test answers. 
For each question, evaluate if the user's answer can be considered correct based on the provided correct answers.
Consider variations in phrasing, partial answers, and semantic equivalence.

Here are the answers to evaluate:
${JSON.stringify(chunk, null, 2)}

Return a JSON array where each object contains:
- question_text: the original question
- user_answer: what the user submitted
- correct_answers: the reference correct answers
- is_correct: boolean indicating if the answer should be considered correct
- explanation: brief explanation of your evaluation

Ensure your response is ONLY the JSON array, with no additional text.`

      const { text } = await generateText({
        model,
        prompt,
      })

      // Clean and parse the chunk response
      let cleanText = text.trim()
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '')
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '')
      }

      const chunkEvaluations = JSON.parse(cleanText)
      allEvaluations.push(...chunkEvaluations)
    }

    return NextResponse.json(allEvaluations)
    
  } catch (error) {
    console.error('Error in quiz evaluation:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to evaluate quiz' },
      { status: 500 }
    )
  }
} 


// only pass in the questions that are not answered correctly (tab-to-autocompleete) 
// cache results  of the evaluation: 
  // 
// need to implement caching (can I use redis?)

// whlile evaluation is running - let's add a loading state


