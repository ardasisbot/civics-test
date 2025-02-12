import json
import os
from pathlib import Path
from typing import List, Dict
import openai
from pydantic import BaseModel, Field
from tenacity import retry, wait_exponential, stop_after_attempt
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# Sample questions for testing
SAMPLE_QUESTIONS = [
    {
        "question_number": 1,
        "question_text": "What is the supreme law of the land?",
        "answers": ["the Constitution"]
    },
    {
        "question_number": 2,
        "question_text": "What does the Constitution do?",
        "answers": [
            "sets up the government",
            "defines the government",
            "protects basic rights of Americans"
        ]
    }
]

class CivicsQuestion(BaseModel):
    question_number: int
    question_text: str
    answers: List[str]
    incorrect_answers: List[str] = []

SYSTEM_PROMPT = """
You are an assistant that generates incorrect answers for multiple-choice questions.
Your response must strictly follow the JSON schema provided.
For each question:
- Generate 3 incorrect answers that seem plausible but are factually wrong.
- Ensure incorrect answers are distinct and do not rephrase the correct ones.
- Avoid joke answers or completely unrealistic options.
- Consider common misconceptions when generating incorrect answers.
- Your response must be a valid JSON matching the schema provided.
"""

class IncorrectAnswerSet(BaseModel):
    question_number: int
    incorrect_answers: List[str]

class IncorrectAnswersResponse(BaseModel):
    answers: List[IncorrectAnswerSet]


@retry(wait=wait_exponential(min=1, max=60), stop=stop_after_attempt(3))
async def get_incorrect_answers(questions: List[Dict]) -> Dict:
    """Get incorrect answers from OpenAI API."""
    
    # Prepare the questions for the prompt
    formatted_questions = []
    for q in questions:
        formatted_questions.append(
            f"Question {q['question_number']}: {q['question_text']}\n"
            f"Correct answer(s): {', '.join(q['answers'])}"
        )
    
    questions_text = "\n\n".join(formatted_questions)
    
    response = openai.beta.chat.completions.parse(
        model="gpt-4o",
        response_format=IncorrectAnswersResponse,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Generate incorrect answers for these questions:\n\n{questions_text}"}
        ],
        temperature=0.7
    )
    
    # Log response details
    print("\nOpenAI API Response:")
    print(f"Model: {response.model}")
    print(f"Usage - Prompt tokens: {response.usage.prompt_tokens}")
    print(f"Usage - Completion tokens: {response.usage.completion_tokens}")
    print(f"Usage - Total tokens: {response.usage.total_tokens}")
    print(f"Response content:\n{response.choices[0].message.content}\n")
    
    return json.loads(response.choices[0].message.content)

def merge_incorrect_answers(questions: List[CivicsQuestion], incorrect_answers: Dict) -> List[CivicsQuestion]:
    """Merge incorrect answers with the original questions."""
    
    question_dict = {q.question_number: q for q in questions}
    
    for answer_set in incorrect_answers.get("answers", []):
        q_num = answer_set.get("question_number")
        if q_num in question_dict:
            question_dict[q_num].incorrect_answers = answer_set.get("incorrect_answers", [])
    
    return list(question_dict.values())

async def main():
    # Setup paths
    input_path = Path("output/merged_questions.json")
    output_path = Path("output/questions_with_incorrect.json")
    
    # Load questions (use sample if input file doesn't exist)
    if input_path.exists():
        with open(input_path, 'r') as f:
            questions_data = json.load(f)
    else:
        print("Input file not found, using sample questions")
        questions_data = SAMPLE_QUESTIONS
    
    questions = [CivicsQuestion(**q) for q in questions_data]
    
    # Process in batches of 10 questions
    batch_size = 10
    all_questions = []
    
    for i in range(0, len(questions), batch_size):
        batch = questions[i:i + batch_size]
        batch_data = [q.dict() for q in batch]
        
        print(f"Processing batch {i//batch_size + 1} of {(len(questions) + batch_size - 1)//batch_size}")
        
        # Get incorrect answers for the batch
        incorrect_answers = await get_incorrect_answers(batch_data)
        
        # Merge incorrect answers with original questions
        merged_batch = merge_incorrect_answers(batch, incorrect_answers)
        all_questions.extend(merged_batch)
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save the results
    with open(output_path, 'w') as f:
        json.dump([q.dict() for q in all_questions], f, indent=2)
    
    print(f"Completed! Output saved to {output_path}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
