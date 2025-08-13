
import { ai } from '../genkit';
import { z } from 'zod';
import { flow } from '@genkit-ai/core';

export const helloFlow = flow(
  {
    name: 'helloFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (name) => {
    const llmResponse = await ai.generate({
      prompt: `Hello Gemini, my name is ${name}`,
    });

    const responseText = llmResponse.text();
    console.log(responseText);
    return responseText;
  }
);
