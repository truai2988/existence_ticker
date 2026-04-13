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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ai_1 = require("ai");
const openai_1 = require("@ai-sdk/openai");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load .env from functions root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
async function main() {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: AI_GATEWAY_API_KEY not found in .env');
        process.exit(1);
    }
    console.log('🔑 API Key found (starts with):', apiKey.substring(0, 10) + '...');
    const openai = (0, openai_1.createOpenAI)({
        apiKey: apiKey,
    });
    try {
        console.log('🤖 Sending test request to OpenAI...');
        const { text } = await (0, ai_1.generateText)({
            model: openai('gpt-4o-mini'),
            prompt: 'Say "Hello, World!" in Japanese.',
        });
        console.log('✅ Success! Response:');
        console.log(text);
    }
    catch (error) {
        console.error('❌ Error during API call:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=test_ai_key.js.map