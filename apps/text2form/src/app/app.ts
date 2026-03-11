import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as Gui from '@golemui/gui-angular';
import { golemForm } from '@golemui/gui-shared';
import * as Core from '@golemui/core';

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
  activeTab: 'form' | 'json' = 'form';
  chatInput = '';
  messages: ChatMessage[] = [
    { role: 'assistant', content: 'Hello! Describe the form you want to build.' },
  ];
  error = '';
  formJson = JSON.stringify(initialFormJson, undefined, 2);

  onJsonChange(value: string) {
    this.formJson = value;
  }

  switchTab(tab: 'form' | 'json') {
    this.activeTab = tab;
  }

  sendMessage() {
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

  onFormHealth(formHealth: Core.FormHealth) {
    if (formHealth.status === 'errored') {
      this.error = formHealth.message;
    }
  }

  onFormEvent(event: Core.FormEvent) {
    console.log('onFormEvent', event);
  }
}
