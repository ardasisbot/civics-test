# USCIS Civic Test Prep

This is a fun experiment to make USCIS civic test prep more engaging. The official study guide only provides a set of allowed answers per question, so we're making it better with both multiple choice and free text versions.

## How it Works

### Multiple Choice
We use LLMs to augment the data by:
- Adding incorrect choices for multiple choice questions
- Generating helpful hints
- Providing detailed correct answers

### Free Text
This is where LLMs make the pipeline much simpler - instead of validating answers with a ton of custom rules, we rely on LLM to validate user's answers for:
- Typos
- Semantically correct answers
- Alternative valid explanations

--

## Offline Scripts 

The `/scripts` folder contains Python utilities that prepare and enrich the USCIS test data:

### 1. `extract_questions.py`
Base data extraction script that:
- Pulls questions from the official USCIS PDF
- Scrapes current questions from the USCIS website
- Merges both sources to create a comprehensive question bank
- Outputs: `merged_questions.json`

### 2. `add_incorrect_answers.py`
Enhances questions for multiple choice by:
- Using GPT-4 to generate 3 plausible but incorrect answers per question
- Ensures wrong answers are distinct and based on common misconceptions
- Outputs: `questions_with_incorrect.json`

### 3. `add_answer_hints.py`
Adds learning aids by:
- Generating concise, contextual hints for each question
- Provides historical context without giving away answers
- Keeps hints under 100 characters when possible
- Outputs: `questions_with_hints.json`

Each script processes data in batches of 10 questions and includes retry logic for API calls. The pipeline runs sequentially: extract → add incorrect answers → add hints, with each step building on the previous output.

## Tech Stack

Built with:
- [Next.js](https://nextjs.org) App Router
- [shadcn/ui](https://ui.shadcn.com/) for component library
- [v0.dev](https://v0.dev/) for design help


## Author

Built by [@asisbot](https://github.com/asisbot)

