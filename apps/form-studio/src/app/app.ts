import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as Core from '@golemui/core';
import * as Gui from '@golemui/gui-angular';
import { Dependencies, golemForm } from '@golemui/gui-shared';
import { GEMINI_INPUT_BUDGET, GeminiService } from './gemini.service';
// import { AnthropicService } from './anthropic.service';
import { DesignComponent } from './design/design.component';
import { PropertiesPanelComponent } from './design/properties-panel.component';
import { EditorComponent } from './editor/editor.component';
import { TokenMeterComponent } from './token-meter/token-meter.component';
import snarkdown from 'snarkdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const initialFormJson = () => {
  const form = golemForm().create({
    form: [
      {
        uid: 'default-message',
        kind: 'display',
        type: 'alert',
        props: {
          text: 'Use the prompt to update the form',
          level: 'info',
        },
      },
    ],
  });
  return { form: form.form.children };
};

@Component({
  imports: [
    CommonModule,
    FormsModule,
    Gui.FormComponent,
    DesignComponent,
    PropertiesPanelComponent,
    TokenMeterComponent,
    EditorComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App {
  private cdr = inject(ChangeDetectorRef);
  private ai = inject(GeminiService);
  // private ai = inject(AnthropicService);
  private designComp = viewChild<DesignComponent>('designComp');
  protected activeTab: 'form' | 'json' | 'design' = 'form';
  protected designSelectedWidget: Record<string, unknown> | null = null;
  protected chatInput =
    'Create a registration form with email, password, confirm password and a submit button';
  protected tokenCount = 0;
  protected readonly maxTokens = GEMINI_INPUT_BUDGET;
  private tokenDebounce: ReturnType<typeof setTimeout> | null = null;
  protected messages: ChatMessage[] = [
    { role: 'assistant', content: 'Hello! Describe the form you want to build.' },
  ];
  protected error = '';
  protected formJson = signal(JSON.stringify(initialFormJson(), undefined, 2));
  protected deps: Dependencies = {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
  };
  protected thinking = false;

  protected onJsonChange(value: string) {
    this.formJson.set(value);
  }

  protected onChatInputChange(value: string) {
    this.chatInput = value;
    if (this.tokenDebounce) clearTimeout(this.tokenDebounce);
    this.tokenDebounce = setTimeout(() => {
      this.tokenCount = value.trim() ? this.ai.estimateTokens(value, this.messages) : 0;
    }, 300);
  }

  protected switchTab(tab: 'form' | 'json' | 'design') {
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

    const response = await this.ai.sendMessage(userMessage);
    this.thinking = false;
    if (response) {
      this.formJson.set(JSON.stringify(response, undefined, 2));
      this.cdr.detectChanges();
    }
  }

  protected onFormHealth(formHealth: Core.FormHealth) {
    if (formHealth.status === 'errored') {
      this.error = formHealth.message;
    }
  }

  protected onFormEvent(event: Core.FormEvent) {
    console.log('onFormEvent', event);
  }

  protected onDesignWidgetChange(flatData: Record<string, unknown>) {
    this.designComp()?.onWidgetChange(flatData);
  }

  protected onFormDefChange(newJson: string) {
    this.formJson.set(newJson);
  }
}
