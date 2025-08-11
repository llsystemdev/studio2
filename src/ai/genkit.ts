/**
 * @fileoverview This file initializes and exports the Genkit AI instance.
 * It serves as the central point for defining and configuring Genkit plugins.
 */
import { genkit } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { inspect } from 'util';

inspect.defaultOptions.depth = null;

// This is the central AI instance that all flows will import and use.
export const ai = genkit({
  plugins: [
    firebase(),
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
