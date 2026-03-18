import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, ChatSession, GenerativeModel } from '@google/generative-ai';
import { generatePrompt } from './golem-prompt';
import { parseLlmResponse, GolemFormDef } from './llm-postprocess';

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
    console.log('systemInstruction', systemInstruction);
    this.model = this.genAI.getGenerativeModel({
      model: model.fast,
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
    this.chat = this.model.startChat({
      history: [],
    });
  }

  async sendMessage(message: string): Promise<GolemFormDef | undefined> {
    if (!this.genAI) {
      console.warn(`genAI hasn't been initialized. Restart the app and enter the API key`);
      return;
    }
    const result = await this.chat.sendMessage(message);
    const response = result.response.text();
    const parsedLlmResponse = parseLlmResponse(response);
    console.log('response', response);
    console.log('parsedLlmResponse', parsedLlmResponse);
    return parsedLlmResponse;
  }

  estimateTokens(message: string, history: { role: string; content: string }[] = []): number {
    const staticContext = generatePrompt();
    const historyText = history.map((m) => m.content).join(' ');
    const totalChars = staticContext.length + historyText.length + message.length;
    return Math.ceil(totalChars / 4);
  }
}
