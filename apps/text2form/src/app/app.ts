import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as Vanilla from '@golemui/gui-angular';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const initialFormJson = `{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "title": "Full Name"
    },
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email Address"
    }
  }
}`;

@Component({
  imports: [CommonModule, FormsModule, Vanilla.FormComponent],
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

  formJson = initialFormJson;
  formDef: any;
  formData: any = {};
  widgetLoaders: any = {};

  constructor() {
    this.updateFormDef();
  }

  updateFormDef() {
    try {
      this.formDef = JSON.parse(this.formJson);
    } catch (e) {
      console.error('Invalid form JSON', e);
    }
  }

  onJsonChange(value: string) {
    this.formJson = value;
    this.updateFormDef();
  }

  switchTab(tab: 'form' | 'json') {
    this.activeTab = tab;
  }

  sendMessage() {
    if (!this.chatInput.trim()) return;

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
}
