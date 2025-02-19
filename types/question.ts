export type Choice = {
  text: string;
  is_correct: boolean;
};

export type OpenTextMode = {
  type: "open_text";
};

export type MultipleChoiceMode = {
  type: "multiple_choice";
  selection_rule: "single_correct" | "multiple_correct" | "exact_n_correct";
  required_correct_count?: number;
  randomize_choices: boolean;
  debug_mode?: boolean;
  num_choices: number;
};

export class Question {
  id: string;
  text: string;
  hint?: string;
  num_selections?: number;
  modes: (OpenTextMode | MultipleChoiceMode)[];
  choices: Choice[];

  constructor(
    id: string,
    text: string,
    modes: (OpenTextMode | MultipleChoiceMode)[],
    choices: Choice[],
    hint?: string,
    num_selections?: number
  ) {
    this.id = id;
    this.text = text;
    this.hint = hint;
    this.num_selections = num_selections;
    this.modes = modes;
    this.choices = choices;
    this.validate();
  }

  private validate(): void {
    if (!this.modes.length) {
      throw new Error(`Question '${this.text}' must have at least one mode.`);
    }

    if (!this.choices.length) {
      throw new Error(`Question '${this.text}' must have at least one choice.`);
    }

    const correctChoices = this.choices.filter(choice => choice.is_correct);
    const incorrectChoices = this.choices.filter(choice => !choice.is_correct);

    if (!correctChoices.length) {
      throw new Error(`Question '${this.text}' must have at least one correct choice.`);
    }

    this.modes.forEach(mode => {
      if (mode.type === "multiple_choice") {
        if (mode.num_choices < correctChoices.length) {
          throw new Error(`Question '${this.text}' has num_choices=${mode.num_choices} but requires at least ${correctChoices.length} correct answers.`);
        }

        if (mode.selection_rule === "single_correct" && correctChoices.length > 1) {
          throw new Error(`Multiple-choice question '${this.text}' is set to 'single' selection but has multiple correct answers.`);
        }

        if (mode.selection_rule === "multiple_correct" && correctChoices.length < 2) {
          throw new Error(`Multiple-choice question '${this.text}' is set to 'multiple_correct' selection but has fewer than two correct answers.`);
        }

        if (mode.selection_rule === "exact_n_correct") {
          if (!mode.required_correct_count || mode.required_correct_count <= 0) {
            throw new Error(`Question '${this.text}' has 'exact_n_correct' selection rule but no valid 'required_correct_count' set.`);
          }
          if (correctChoices.length < mode.required_correct_count) {
            throw new Error(`Question '${this.text}' requires exactly ${mode.required_correct_count} correct answers, but only ${correctChoices.length} were provided.`);
          }
        }
      }
    });
  }

  getFilteredChoices(mode: MultipleChoiceMode): Choice[] {
    if (mode.type !== "multiple_choice") {
      throw new Error(`getFilteredChoices should only be called with MultipleChoiceMode`);
    }

    const correctChoices = this.choices.filter(choice => choice.is_correct);
    const incorrectChoices = this.choices.filter(choice => !choice.is_correct);

    let selectedChoices: Choice[] = [];


    switch (mode.selection_rule) {
      case "single_correct":
        selectedChoices = [...correctChoices.slice(0, 1)];
        const incorrectNeeded = mode.num_choices - 1;
        selectedChoices.push(...(mode.randomize_choices 
          ? this.shuffleArray(incorrectChoices).slice(0, incorrectNeeded)
          : incorrectChoices.slice(0, incorrectNeeded)));
        break;

      case "multiple_correct":
        selectedChoices = [...correctChoices.slice(0, this.num_selections)];
        const multipleIncorrectNeeded = mode.num_choices - selectedChoices.length;
        selectedChoices.push(...(mode.randomize_choices
          ? this.shuffleArray(incorrectChoices).slice(0, multipleIncorrectNeeded)
          : incorrectChoices.slice(0, multipleIncorrectNeeded)));
        break;

      // case "exact_n_correct":
      //   if (correctChoices.length < (mode.required_correct_count || 0)) {
      //     throw new Error(`Not enough correct answers for '${this.text}'`);
      //   }
      //   selectedChoices = mode.randomize_choices
      //     ? this.shuffleArray(correctChoices).slice(0, mode.required_correct_count)
      //     : correctChoices.slice(0, mode.required_correct_count);
      //   const exactNIncorrectNeeded = mode.num_choices - selectedChoices.length;
      //   selectedChoices.push(...(mode.randomize_choices
      //     ? this.shuffleArray(incorrectChoices).slice(0, exactNIncorrectNeeded)
      //     : incorrectChoices.slice(0, exactNIncorrectNeeded)));
      //   break;
    }

    return selectedChoices.slice(0, mode.num_choices);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  evaluateAnswer(userAnswer: string[] | string, isMultipleChoice: boolean): boolean {
    const correctAnswers = this.choices
      .filter(choice => choice.is_correct)
      .map(choice => choice.text);

    if (isMultipleChoice) {
      const mode = this.modes.find(m => m.type === "multiple_choice") as MultipleChoiceMode;
      return this.evaluateMultipleChoice(userAnswer, correctAnswers, mode);
    }
    
    return this.evaluateOpenText(userAnswer, correctAnswers);
  }

  private evaluateMultipleChoice(
    userAnswer: string[] | string,
    correctAnswers: string[],
    mode: MultipleChoiceMode
  ): boolean {
    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
    
    // if (mode.selection_rule === "multiple_correct") {
    //   return (
    //     userAnswers.length === correctAnswers.length &&
    //     userAnswers.every(answer => correctAnswers.includes(answer)) &&
    //     correctAnswers.every(answer => userAnswers.includes(answer))
    //   );
    // }
    
    // single_correct or exact_n_correct
    return userAnswers.length === 1 && correctAnswers.includes(userAnswers[0]);
  }

  private evaluateOpenText(userAnswer: string[] | string, correctAnswers: string[]): boolean {
    const userAnswerText = Array.isArray(userAnswer) ? '' : (userAnswer || '');
    return correctAnswers.some(answer => 
      Question.normalizeText(answer) === Question.normalizeText(userAnswerText)
    );
  }

  // Static utility methods for text normalization
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map(word => this.convertNumberWords(word))
      .join(' ')
      .replace(/\([^)]*\)/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static convertNumberWords(text: string): string {
    // Move NUMBER_WORDS constant here
    const NUMBER_WORDS: { [key: string]: string } = {
      'one': '1', 'two': '2', /* ... rest of the mapping ... */
    };
    
    let result = text.toLowerCase();
    
    // Handle compound numbers
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
  }
} 