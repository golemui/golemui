import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as Gui from '@golemui/gui-angular';
import { golemForm } from '@golemui/gui-shared';
import * as Core from '@golemui/core';
import { GeminiService } from './gemini.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const initialFormJson = golemForm().create({
  form: [
    {
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Use the prompt to update the form',
        level: 'info',
      },
    },
  ],
});

@Component({
  imports: [CommonModule, FormsModule, Gui.FormComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App {
  private geminim = inject(GeminiService);
  protected activeTab: 'form' | 'json' = 'form';
  protected chatInput =
    'Create a registration form with email, password, confirm password and a submit button';
  protected tokenCount = 0;
  private tokenDebounce: ReturnType<typeof setTimeout> | null = null;
  protected messages: ChatMessage[] = [
    { role: 'assistant', content: 'Hello! Describe the form you want to build.' },
  ];
  protected error = '';
  protected formJson = JSON.stringify(initialFormJson, undefined, 2);
  protected thinking = false;

  protected onJsonChange(value: string) {
    this.formJson = value;
  }

  protected onChatInputChange(value: string) {
    this.chatInput = value;
    if (this.tokenDebounce) clearTimeout(this.tokenDebounce);
    this.tokenDebounce = setTimeout(() => {
      this.tokenCount = value.trim() ? this.geminim.estimateTokens(value, this.messages) : 0;
    }, 300);
  }

  protected switchTab(tab: 'form' | 'json') {
    this.activeTab = tab;
  }

  protected async sendMessage() {
    if (!this.chatInput.trim()) {
      return;
    }

    // Add user message
    this.messages.push({ role: 'user', content: this.chatInput });
    this.thinking = true;
    const userMessage = this.chatInput;
    this.chatInput = '';

    const response = (await this.geminim.sendMessage(userMessage)) as string;
    this.thinking = false;
    this.formJson = JSON.stringify(JSON.parse(response), undefined, 2);
  }

  protected onFormHealth(formHealth: Core.FormHealth) {
    if (formHealth.status === 'errored') {
      this.error = formHealth.message;
    }
  }

  protected onFormEvent(event: Core.FormEvent) {
    console.log('onFormEvent', event);
  }
}
