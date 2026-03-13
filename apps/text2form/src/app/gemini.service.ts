import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, ChatSession, GenerativeModel, Schema } from '@google/generative-ai';
import { GOLEM_LLM_SCHEMA, GOLEM_SYSTEM_PROMPT } from './golem-llm-schema';

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
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: GOLEM_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: GOLEM_LLM_SCHEMA as Schema,
      },
    });
    this.chat = this.model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 2000 },
    });
  }

  async sendMessage(message: string) {
    if (!this.genAI) {
      console.warn(`genAI hasn't been initialized. Restart the app and enter the API key`);
      return;
    }
    const result = await this.chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  }

  estimateTokens(message: string, history: { role: string; content: string }[] = []): number {
    // Static context sent with every request: system prompt + response schema
    const staticContext = GOLEM_SYSTEM_PROMPT + JSON.stringify(GOLEM_LLM_SCHEMA);
    const historyText = history.map((m) => m.content).join(' ');
    const totalChars = staticContext.length + historyText.length + message.length;
    // ~4 characters per token (common heuristic for LLMs)
    return Math.ceil(totalChars / 4);
  }
}
