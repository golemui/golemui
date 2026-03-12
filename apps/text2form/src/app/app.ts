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
      kind: 'input',
      type: 'textinput',
      path: 'email',
    },
    {
      kind: 'input',
      type: 'password',
      path: 'password',
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Send',

      on: { click: 'submit' },
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
  protected chatInput = '';
  protected messages: ChatMessage[] = [
    { role: 'assistant', content: 'Hello! Describe the form you want to build.' },
  ];
  protected error = '';
  protected formJson = JSON.stringify(initialFormJson, undefined, 2);

  protected onJsonChange(value: string) {
    this.formJson = value;
  }

  protected switchTab(tab: 'form' | 'json') {
    this.activeTab = tab;
  }

  protected sendMessage() {
    if (!this.chatInput.trim()) {
      return;
    }

    // Add user message
    this.messages.push({ role: 'user', content: this.chatInput });
    const userMessage = this.chatInput;
    this.chatInput = '';

    // Mock assistant reply
    setTimeout(() => {
      this.messages.push({
        role: 'assistant',
        content: `I have updated the form based on: "${userMessage}".`,
      });
      // In a real app we would call the LLM and update formJson here.
    }, 500);
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
