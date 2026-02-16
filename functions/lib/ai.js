"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCreativeContent = void 0;
const functions = __importStar(require("firebase-functions"));
const ai_1 = require("ai");
const openai_1 = require("@ai-sdk/openai");
const dotenv = __importStar(require("dotenv"));
const admin = __importStar(require("firebase-admin"));
// Initialize dotenv
dotenv.config();
// Initialize OpenAI provider
// If using Vercel AI Gateway, you might need to adjust the baseURL or simply use the standard OpenAI provider if compatible.
// For now, we'll use the standard OpenAI provider which is the most common integration.
const openai = (0, openai_1.createOpenAI)({
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
exports.generateCreativeContent = functions.https.onRequest(async (req, res) => {
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
        const { text } = await (0, ai_1.generateText)({
            model: openai('gpt-4-turbo'), // Use a suitable model
            prompt: prompt,
            // maxTokens: 500, // Limit response length
        });
        // 5. Respond
        res.status(200).json({ result: text });
    }
    catch (error) {
        console.error('Error generating content:', error);
        res.status(500).send('Internal Server Error: Failed to generate content.');
    }
});
//# sourceMappingURL=ai.js.map