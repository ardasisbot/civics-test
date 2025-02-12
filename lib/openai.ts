import { OpenAI } from 'openai';

export const openai = (model: string) => new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model
}); 