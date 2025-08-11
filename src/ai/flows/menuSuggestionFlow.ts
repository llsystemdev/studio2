'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string().describe('A list of dishes'),
    outputSchema: z.string().describe('The menu suggestion'),
  },
  async (prompt) => {
    const { text } = await ai.generate({
      prompt: `Given a list of dishes, suggest a menu. The dishes are: ${prompt}`,
    });
    return text;
  }
);
