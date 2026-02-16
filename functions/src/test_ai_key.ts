import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from functions root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: AI_GATEWAY_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('🔑 API Key found (starts with):', apiKey.substring(0, 10) + '...');

  const openai = createOpenAI({
    apiKey: apiKey,
  });

  try {
    console.log('🤖 Sending test request to OpenAI...');
    const { text } = await generateText({
      model: openai('gpt-4o-mini'), // Use a cheaper model for testing
      prompt: 'Say "Hello, World!" in Japanese.',
    });

    console.log('✅ Success! Response:');
    console.log(text);
  } catch (error) {
    console.error('❌ Error during API call:', error);
    process.exit(1);
  }
}

main();
