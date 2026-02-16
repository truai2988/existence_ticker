import * as functions from 'firebase-functions';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';

// Initialize dotenv
dotenv.config();

// Initialize OpenAI provider
// If using Vercel AI Gateway, you might need to adjust the baseURL or simply use the standard OpenAI provider if compatible.
// For now, we'll use the standard OpenAI provider which is the most common integration.
const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
});

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Cloud Function: Generate Creative Content
 * 
 * Uses Vercel AI SDK to generate text based on a prompt.
 * 
 * Request Body:
 * {
 *   "prompt": "Invent a new holiday..."
 * }
 */
export const generateCreativeContent = functions.https.onRequest(async (req, res) => {
  // 1. CORS Setup
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  // 2. Validate Request
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).send('Missing or invalid "prompt" in request body.');
    return;
  }

  // 3. Check for API Key
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error('Missing AI_GATEWAY_API_KEY in environment variables.');
    res.status(500).send('Server configuration error: API Key missing.');
    return;
  }

  try {
    // 4. Generate Content
    const { text } = await generateText({
      model: openai('gpt-4-turbo'), // Use a suitable model
      prompt: prompt,
      // maxTokens: 500, // Limit response length
    });

    // 5. Respond
    res.status(200).json({ result: text });

  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).send('Internal Server Error: Failed to generate content.');
  }
});
