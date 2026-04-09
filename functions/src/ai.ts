import * as functions from 'firebase-functions';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';

// Initialize dotenv
dotenv.config();

// Initialize Google Gemini provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
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
  if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in environment variables.');
    res.status(500).send('Server configuration error: API Key missing.');
    return;
  }

  try {
    // 4. Generate Content
    const { text } = await generateText({
      model: google('gemini-2.5-flash'), // Use a suitable model
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

/**
 * Cloud Function: Generate Wish Draft
 * 
 * Uses Vercel AI SDK to generate a warm 3-line wish based on a brief keyword.
 * 
 * Call Data:
 * {
 *   "keyword": "いつもありがとう"
 * }
 */
export const generateWishDraft = functions.https.onCall(async (data, context) => {
  // 1. Security Check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { keyword } = data;

  if (!keyword || typeof keyword !== 'string' || keyword.length > 50) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid keyword provided. Must be under 50 characters.');
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in environment variables.');
    throw new functions.https.HttpsError('internal', 'Server configuration error: API Key missing.');
  }

  const systemPrompt = `あなたは、お金を介さない純粋な助け合いインフラ「Existence Ticker」の中で、ユーザーの言葉を温かく綴り直す「代筆の万年筆」です。
ユーザーから短い要望が入力されますので、それを見知らぬご近所さんや他の利用者に向けた、心温まる3行程度（最大150文字程度）の「お願い文」に変換してください。

【トーン＆マナー】
- 業者への依頼のような事務的な言葉遣いや、金銭・報酬を匂わせる言葉は絶対に使わないこと。
- 「完璧な作業」を求めるのではなく、「少しだけ手を貸してほしい」「そばにいてくれるだけで助かる」という、余白と謙虚さのあるニュアンスにすること。
- 読む側が「それくらいならやってあげようかな」と自然に思える、親しみやすいトーンであること。

【制約事項】
- 出力は必ず3行以内、全体で最大150文字程度に収めること。
- AIとしての前置きや後書き（例: 「承知しました」「以下のようになります」等）は一切含めず、メッセージの本文のみを直接出力すること。

【出力例】
入力キーワード: 「引っ越しの段ボールを運ぶの手伝って」
出力:
今週末、近くへ引っ越すのですが、一人では運べない段ボールがあり途方に暮れています。
プロのような作業は求めていません。30分ほど、一緒に端を持って運んでくださる方がいれば本当に助かります。
手を貸していただけませんか？`;

  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `キーワード: ${keyword}`,
    });

    return { draft: text.trim() };
  } catch (error) {
    console.error('Error generating wish draft:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate wish draft.');
  }
});
