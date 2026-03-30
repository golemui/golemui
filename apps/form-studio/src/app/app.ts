import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
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
  role: 'user' | 'assistant' | 'thinking';
  content: string;
  thinkingGroupId?: number;
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
  private chatHistory = viewChild<ElementRef<HTMLElement>>('chatHistory');
  protected activeTab: 'form' | 'json' | 'design' = 'form';
  protected designSelectedWidget: Record<string, unknown> | null = null;
  protected collapsedToolbarGroups = new Set<string>();
  protected formValidateOn = signal<Core.ValidateOn>('eager');
  protected formDirection = signal<'ltr' | 'rtl'>('ltr');
  protected formPropertiesWidget = computed(() => ({
    type: '__form__',
    uid: 'form',
    validateOn: this.formValidateOn(),
    direction: this.formDirection(),
  }));

  protected toggleToolbarGroup(group: string) {
    if (this.collapsedToolbarGroups.has(group)) {
      this.collapsedToolbarGroups.delete(group);
    } else {
      this.collapsedToolbarGroups.add(group);
    }
  }
  protected chatInput =
    'Create a registration form with required fields email, password, confirm password and a submit button';
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
  protected collapsedGroups = new Set<number>();
  private thinkingGroupId = 0;

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
    if (this.activeTab === 'design' && tab !== 'design') {
      this.designSelectedWidget = null;
    }
    this.activeTab = tab;
  }

  protected async sendMessage() {
    if (!this.chatInput.trim()) {
      return;
    }

    this.thinkingGroupId++;

    // Add user message
    this.messages.push({ role: 'user', content: this.chatInput });
    this.thinking = true;
    const userMessage = this.chatInput;
    this.chatInput = '';

    const groupId = this.thinkingGroupId;
    const response = await this.ai.sendMessage(userMessage, (thought) => {
      this.messages.push({ role: 'thinking', content: thought, thinkingGroupId: groupId });
      this.scrollChatToBottom();
    });
    this.thinking = false;
    this.collapsedGroups.add(groupId);
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

  protected onToolbarDragStart(event: DragEvent, kind: string, type: string) {
    event.dataTransfer?.setData('application/golem-widget', JSON.stringify({ kind, type }));
    event.dataTransfer!.effectAllowed = 'copy';
  }

  protected onDesignWidgetChange(flatData: Record<string, unknown>) {
    this.designComp()?.onWidgetChange(flatData);
  }

  protected onFormPropertiesChange(flatData: Record<string, unknown>) {
    if ('validateOn' in flatData) this.formValidateOn.set(flatData['validateOn'] as Core.ValidateOn);
    if ('direction' in flatData) this.formDirection.set(flatData['direction'] as 'ltr' | 'rtl');
  }

  protected onFormDefChange(newJson: string) {
    this.formJson.set(newJson);
  }

  protected toggleThinkingGroup(groupId: number) {
    if (this.collapsedGroups.has(groupId)) {
      this.collapsedGroups.delete(groupId);
    } else {
      this.collapsedGroups.add(groupId);
    }
  }

  protected getThinkingGroupCount(groupId: number): number {
    return this.messages.filter((m) => m.thinkingGroupId === groupId).length;
  }

  private scrollChatToBottom() {
    const el = this.chatHistory()?.nativeElement;
    if (el) {
      setTimeout(() => (el.scrollTop = el.scrollHeight));
    }
  }
}
