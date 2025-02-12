import PyPDF2
import re
import json
import asyncio
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup, Tag

# Define output directory
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

class CivicsQuestion(BaseModel):
    question_number: int
    question_text: str
    answers: List[str]

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from each page of a PDF and return as a single string."""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text_content = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text.strip())
        return "\n".join(text_content)

def clean_extracted_text(text: str) -> str:
    """Clean up the extracted PDF text."""
    # Remove unwanted text and line numbers
    text = re.sub(r"\*\s+If you are 65 years old or older.*?\nwww\.uscis\.gov\s*", "", text, flags=re.DOTALL)
    text = re.sub(r"^\s*-\d+-\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\t+", " ", text)  # Replace tabs with spaces
    return text

def parse_civics_questions(text: str) -> List[CivicsQuestion]:
    """
    Parses numbered civics questions and ensures:
    - Answers start with a bullet (▪, -, *, •).
    - Section headers (e.g., "AMERICAN HISTORY") and subsection headers (e.g., "A: Responsibilities") are NOT included as answers.
    - Multi-line answers are properly joined.
    """

    question_pattern = re.compile(r"\b(\d+)\.\s+(.*)")  # Matches "19. Question text..."
    bullet_pattern = re.compile(r"^\s*[▪\-\*\•]\s+(.*)$")  # Matches bullet answer lines
    subsection_pattern = re.compile(r"^\s*[A-Z]:\s+.*$")  # Matches subsection headers like "A: Responsibilities"
    section_pattern = re.compile(r"^[A-Z\s]+$")  # Matches full uppercase section headers like "AMERICAN HISTORY"

    lines = text.splitlines()
    questions = []

    current_question_number: Optional[int] = None
    current_question_text: List[str] = []
    current_answers: List[str] = []

    in_answer = False
    current_answer_index: Optional[int] = None

    def save_current_question():
        """Saves the current question if it has valid content."""
        if current_question_number is not None:
            q_text = " ".join(current_question_text).strip()
            cleaned_answers = [ans.strip() for ans in current_answers if ans.strip()]

            questions.append(
                CivicsQuestion(
                    question_number=current_question_number,
                    question_text=q_text,
                    answers=cleaned_answers
                )
            )

    for line in lines:
        stripped_line = line.rstrip("\r\n")

        # Skip subsection headers (e.g., "A: Responsibilities") and section headers (e.g., "AMERICAN HISTORY")
        if subsection_pattern.match(stripped_line) or section_pattern.match(stripped_line):
            in_answer = False  # Prevent from being considered as part of an answer
            continue  # Skip this line

        # 1. Check if the line contains a question number
        question_match = question_pattern.search(stripped_line.strip())
        if question_match:
            save_current_question()  # Save previous question before starting a new one

            current_question_number = int(question_match.group(1))
            current_question_text = [question_match.group(2)]
            current_answers = []
            in_answer = False
            current_answer_index = None
            continue

        # 2. If we have a current question, check for bullet (answer) lines
        if current_question_number is not None:
            bullet_match = bullet_pattern.match(stripped_line)
            if bullet_match:
                # New answer starts here
                answer_text = bullet_match.group(1)
                current_answers.append(answer_text.strip())
                current_answer_index = len(current_answers) - 1
                in_answer = True
            else:
                # If the line doesn't start with a bullet but we are in an answer, append to the previous answer
                if in_answer and current_answer_index is not None:
                    current_answers[current_answer_index] += " " + stripped_line.strip()
                else:
                    # Otherwise, treat it as a continuation of the question text
                    if stripped_line.strip():
                        current_question_text.append(stripped_line.strip())

    # Final question
    save_current_question()

    return questions

async def fetch_content_async(url: str) -> str:
    """Fetch webpage content using Playwright."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url)
        content = await page.content()
        await browser.close()
    return content

def parse_civics_questions_from_html(html_content: str) -> List[CivicsQuestion]:
    """
    Parse the given HTML, locate <div id="acc--content1">,
    and extract questions of the form: "XX. Some question?" plus <ul><li> answers.
    """

    soup = BeautifulSoup(html_content, 'html.parser')

    # Locate the hidden (or accordion) div by ID
    container = soup.find('div', id='acc--content1')
    if not container:
        # If container is not found, return empty list
        return []

    # Regex to match lines like "20. Who is one of your state's U.S. Senators now?*"
    question_pattern = re.compile(r"^\s*(\d+)\.\s+(.*)$")

    questions = []

    # Find all <p> tags in that container
    p_tags = container.find_all('p')

    for p_tag in p_tags:
        strong_tag = p_tag.find('strong')
        if not strong_tag:
            continue  # skip <p> without <strong> text

        strong_text = strong_tag.get_text(strip=True)

        # Check if it matches something like "20. Some question text"
        match = question_pattern.match(strong_text)
        if not match:
            continue

        question_number = int(match.group(1))
        question_text = match.group(2)

        answers = []

        # Get next siblings to find a <ul> with <li> items
        next_sib = p_tag.next_sibling
        while next_sib:
            if isinstance(next_sib, Tag):
                if next_sib.name == 'ul':
                    # Found <ul> with answer <li> items
                    li_tags = next_sib.find_all('li')
                    for li in li_tags:
                        li_text = li.get_text(separator=' ', strip=True)
                        answers.append(li_text)
                    break  # done with this question's answers

                # If we see another <p><strong> tag, that's a new question
                if next_sib.name == 'p' and next_sib.find('strong'):
                    break
            next_sib = next_sib.next_sibling

        # Construct and store the question
        questions.append(
            CivicsQuestion(
                question_number=question_number,
                question_text=question_text.strip(),
                answers=answers
            )
        )

    return questions

async def fetch_uscis_html_and_parse() -> List[CivicsQuestion]:
    """Fetch and parse current questions from USCIS website."""
    url = 'https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates'
    html = await fetch_content_async(url)
    return parse_civics_questions_from_html(html)

def merge_questions(parsed_questions: List[CivicsQuestion], current_questions: List[CivicsQuestion]) -> List[CivicsQuestion]:
    """Merge PDF-parsed questions with current web questions."""
    current_question_dict = {q.question_number: q for q in current_questions}
    return [current_question_dict.get(q.question_number, q) for q in parsed_questions]

async def main():
    # Extract from PDF
    pdf_path = "./public/assets/100 Questions.pdf"
    extracted_text = extract_text_from_pdf(pdf_path)
    cleaned_text = clean_extracted_text(extracted_text)
    
    # Save cleaned text
    with open(OUTPUT_DIR / "cleaned_text.txt", 'w', encoding='utf-8') as f:
        f.write(cleaned_text)
    
    # Parse questions from PDF
    parsed_questions = parse_civics_questions(cleaned_text)
    
    # Save parsed questions
    with open(OUTPUT_DIR / "parsed_questions.json", 'w', encoding='utf-8') as f:
        json.dump([q.dict() for q in parsed_questions], f, indent=2)
    
    # Fetch current questions from USCIS website
    current_questions = await fetch_uscis_html_and_parse()
    
    # Save current questions
    with open(OUTPUT_DIR / "current_questions.json", 'w', encoding='utf-8') as f:
        json.dump([q.dict() for q in current_questions], f, indent=2)
    
    # Merge questions and save final result
    merged_questions = merge_questions(parsed_questions, current_questions)
    with open(OUTPUT_DIR / "merged_questions.json", 'w', encoding='utf-8') as f:
        json.dump([q.dict() for q in merged_questions], f, indent=2)

if __name__ == "__main__":
    asyncio.run(main())
