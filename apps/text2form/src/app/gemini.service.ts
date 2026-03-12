import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, ChatSession, GenerativeModel, Schema } from '@google/generative-ai';
import $RefParser from '@apidevtools/json-schema-ref-parser';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;
  private chat!: ChatSession;
  private golemJsonSchema!: Schema;

  constructor() {
    setTimeout(() => this.initilaize(), 250);
  }

  private async initilaize() {
    let apiKey = localStorage.getItem('golemGenAiApiKey');
    if (!apiKey || apiKey === 'null') {
      apiKey = window.prompt('Enter Gemini API_KEY');
      localStorage.setItem('golemGenAiApiKey', apiKey as string);
    }
    if (!apiKey) {
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.golemJsonSchema = await this.dereferencedSchema();
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: this.golemJsonSchema,
      },
    });
    this.chat = this.model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 500 },
    });
  }

  private async dereferencedSchema() {
    return await $RefParser.dereference(mySchema);
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
}
