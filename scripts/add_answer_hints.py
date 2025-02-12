import json
import os
from pathlib import Path
from typing import List, Dict
import openai
from pydantic import BaseModel
from tenacity import retry, wait_exponential, stop_after_attempt
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

class CivicsQuestion(BaseModel):
    question_number: int
    question_text: str
    answers: List[str]
    incorrect_answers: List[str]
    hint: str = ""  # Changed from List[str] to str with empty default

SYSTEM_PROMPT = """
You are an assistant that generates helpful hints for civics test questions.
Your response must strictly follow the JSON schema provided.
For each question:
- Generate a single concise hint that guides the user towards the answer
- The hint should provide context without giving away the answer
- Include historical context where relevant
- Avoid directly stating or rephrasing the answer
- Keep hints under 100 characters when possible
- The hint should always be helpful and not misleading. If not sure, you can use rhymes with the answer.
- Your response must be a valid JSON matching the schema provided
"""

class QuestionHint(BaseModel):
    question_number: int
    hint: str  # Changed from hints: List[str]

class HintsResponse(BaseModel):
    hints: List[QuestionHint]

@retry(wait=wait_exponential(min=1, max=60), stop=stop_after_attempt(3))
async def get_hints(questions: List[Dict]) -> Dict:
    """Get hints from OpenAI API."""
    
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
        response_format=HintsResponse,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Generate hints for these questions:\n\n{questions_text}"}
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

def merge_hints(questions: List[CivicsQuestion], hints_data: Dict) -> List[CivicsQuestion]:
    """Merge hints with the original questions."""
    
    question_dict = {q.question_number: q for q in questions}
    
    for hint_set in hints_data.get("hints", []):
        q_num = hint_set.get("question_number")
        if q_num in question_dict:
            question_dict[q_num].hint = hint_set.get("hint", "")  # Changed from hints to hint
    
    return list(question_dict.values())

async def main():
    # Setup paths
    input_path = Path("output/questions_with_incorrect.json")
    output_path = Path("output/questions_with_hints.json")
    
    # Load questions
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
        
    with open(input_path, 'r') as f:
        questions_data = json.load(f)
    
    questions = [CivicsQuestion(**q) for q in questions_data]
    
    # Process in batches of 10 questions
    batch_size = 10
    all_questions = []
    
    for i in range(0, len(questions), batch_size):
        batch = questions[i:i + batch_size]
        batch_data = [q.dict() for q in batch]
        
        print(f"Processing batch {i//batch_size + 1} of {(len(questions) + batch_size - 1)//batch_size}")
        
        # Get hints for the batch
        hints = await get_hints(batch_data)
        
        # Merge hints with original questions
        merged_batch = merge_hints(batch, hints)
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