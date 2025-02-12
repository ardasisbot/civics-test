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

    // Create model instance with Gemini Pro
    const model = google('gemini-2.0-flash-lite-preview-02-05')

    // Construct prompt for LLM
    const prompt = `You are an expert evaluator for US Civics test answers. 
For each question, evaluate if the user's answer can be considered correct based on the provided correct answers.
Consider variations in phrasing, partial answers, and semantic equivalence.

Here are the answers to evaluate:
${JSON.stringify(answers, null, 2)}

Return a JSON array where each object contains:
- question_text: the original question
- user_answer: what the user submitted
- correct_answers: the reference correct answers
- is_correct: boolean indicating if the answer should be considered correct
- explanation: brief explanation of your evaluation

Ensure your response is ONLY the JSON array, with no additional text.`

    // Generate evaluation using Gemini
    const { text } = await generateText({
      model,
      prompt,
    })

    console.log('Raw LLM Response:', text);

    try {
      // Clean and validate the text response
      let cleanText = text.trim();
      
      // Check if text starts/ends with backticks (common in LLM responses)
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      console.log('Cleaned text before parsing:', cleanText);

      // Parse the response
      const evaluations = JSON.parse(cleanText)
      console.log('Parsed Evaluations:', evaluations);
      
      return NextResponse.json(evaluations)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Failed to parse text:', text);
      return NextResponse.json(
        { error: 'Failed to parse LLM response' },
        { status: 500 }
      )
    }
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