import { defineConfig } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';

export default defineConfig({
  plugins: [
    firebase(),
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
