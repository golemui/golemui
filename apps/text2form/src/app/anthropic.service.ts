import { Injectable } from '@angular/core';
import Anthropic from '@anthropic-ai/sdk';
import { GOLEM_LLM_SCHEMA, GOLEM_SYSTEM_PROMPT } from './anthropìc-llm-schema';

@Injectable({
  providedIn: 'root',
})
export class AnthropicService {
  private client!: Anthropic;
  private history: Anthropic.MessageParam[] = [];

  constructor() {
    setTimeout(() => this.initialize(), 250);
  }

  private initialize() {
    let apiKey = localStorage.getItem('golemAnthropicApiKey');
    if (!apiKey || apiKey === 'null') {
      apiKey = window.prompt('Enter Anthropic API Key');
      localStorage.setItem('golemAnthropicApiKey', apiKey as string);
    }
    if (!apiKey) {
      return;
    }
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  async sendMessage(message: string): Promise<string | undefined> {
    if (!this.client) {
      console.warn(
        `Anthropic client hasn't been initialized. Restart the app and enter the API key`,
      );
      return;
    }

    this.history.push({ role: 'user', content: message });

    const response = await this.client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      system: GOLEM_SYSTEM_PROMPT,
      output_config: {
        format: {
          type: 'json_schema',
          schema: GOLEM_LLM_SCHEMA,
        },
      },
      messages: this.history,
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    const text = textBlock?.text ?? '';
    this.history.push({ role: 'assistant', content: text });
    return text;
  }

  estimateTokens(message: string, history: { role: string; content: string }[] = []): number {
    const staticContext = GOLEM_SYSTEM_PROMPT + JSON.stringify(GOLEM_LLM_SCHEMA);
    const historyText = history.map((m) => m.content).join(' ');
    const totalChars = staticContext.length + historyText.length + message.length;
    return Math.ceil(totalChars / 4);
  }
}
