import { Injectable } from '@angular/core';
import { ChatSession, GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { generatePrompt } from './golem-prompt';
import { GolemFormDef, parseLlmResponse } from './llm-postprocess';

export const GEMINI_MAX_TOKENS = 1_048_576; // gemini-2.5-flash context window
export const GEMINI_MAX_OUTPUT_TOKENS = 65_536; // reserved for model output
export const GEMINI_INPUT_BUDGET = GEMINI_MAX_TOKENS - GEMINI_MAX_OUTPUT_TOKENS;

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;
  private chat!: ChatSession;

  constructor() {
    setTimeout(() => this.initilaize(), 250);
  }

  private initilaize() {
    let apiKey = localStorage.getItem('golemGenAiApiKey');
    if (!apiKey || apiKey === 'null') {
      apiKey = window.prompt('Enter Gemini API_KEY');
      localStorage.setItem('golemGenAiApiKey', apiKey as string);
    }
    if (!apiKey) {
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    const model = { fast: 'gemini-2.5-flash', think: 'gemini-2.5-pro' };
    const systemInstruction = generatePrompt();
    this.model = this.genAI.getGenerativeModel({
      model: model.fast,
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        thinkingConfig: {
          includeThoughts: true,
        },
      } as any,
    });
    this.chat = this.model.startChat({
      history: [],
    });
  }

  async sendMessage(
    message: string,
    onThought?: (text: string) => void,
  ): Promise<GolemFormDef | undefined> {
    if (!this.genAI) {
      console.warn(`genAI hasn't been initialized. Restart the app and enter the API key`);
      return;
    }

    let jsonResponse = '';

    const result = await this.chat.sendMessageStream(message);

    for await (const chunk of result.stream) {
      const candidate = chunk.candidates?.[0];
      if (!candidate?.content?.parts) continue;

      for (const part of candidate.content.parts) {
        if ((part as any).thought && part.text) {
          onThought?.(part.text);
        } else if (part.text) {
          jsonResponse += part.text;
        }
      }
    }

    const parsedLlmResponse = parseLlmResponse(jsonResponse);
    return parsedLlmResponse;
  }

  estimateTokens(message: string, history: { role: string; content: string }[] = []): number {
    const staticContext = generatePrompt();
    const historyText = history.map((m) => m.content).join(' ');
    const totalChars = staticContext.length + historyText.length + message.length;
    return Math.ceil(totalChars / 4);
  }
}
