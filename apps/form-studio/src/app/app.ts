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
import { FileAttachment, GEMINI_INPUT_BUDGET, GeminiService } from './gemini.service';
// import { AnthropicService } from './anthropic.service';
import { DesignComponent } from './design/design.component';
import { PropertiesPanelComponent } from './design/properties-panel.component';
import { EditorComponent } from './editor/editor.component';
import { TokenMeterComponent } from './token-meter/token-meter.component';
import snarkdown from 'snarkdown';

interface AttachedFile {
  name: string;
  mimeType: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'thinking';
  content: string;
  thinkingGroupId?: number;
  attachments?: AttachedFile[];
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
  protected viewportSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  protected readonly viewportWidths = { mobile: '375px', tablet: '768px', desktop: '100%' };
  protected designSelectedWidget: Record<string, unknown> | null = null;
  protected collapsedToolbarGroups = new Set<string>();
  protected formValidateOn = signal<Core.ValidateOn>('eager');
  protected formLocale = signal<string>('en');
  protected formPropertiesWidget = computed(() => ({
    type: '__form__',
    uid: 'form',
    validateOn: this.formValidateOn(),
    locale: this.formLocale(),
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
  protected pendingFiles: FileAttachment[] = [];
  protected fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  protected isDragOver = false;
  protected fileError = '';
  private readonly MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

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

  protected get canSend(): boolean {
    return (this.chatInput.trim().length > 0 || this.pendingFiles.length > 0) && !this.thinking;
  }

  // Gemini supports text/plain, text/html, text/css, text/javascript, text/csv,
  // text/markdown, text/xml, application/pdf, and image/* / audio* / video/*.
  // JSON and other unsupported text-based types are normalized to text/plain.
  private resolveGeminiMimeType(file: File): string {
    const type = file.type || 'application/octet-stream';
    const SUPPORTED = new Set([
      'application/pdf',
      'text/plain', 'text/html', 'text/css', 'text/javascript',
      'text/x-typescript', 'text/csv', 'text/markdown',
      'text/x-python', 'text/xml', 'text/rtf',
      'application/x-javascript', 'application/x-typescript',
      'application/x-python', 'application/rtf',
    ]);
    if (SUPPORTED.has(type)) return type;
    if (type.startsWith('image/') || type.startsWith('audio/') || type.startsWith('video/')) return type;
    // Treat any remaining text-like or structured-text types as plain text
    if (type.startsWith('text/') || type === 'application/json' || type === 'application/xml') return 'text/plain';
    return type; // pass through; Gemini will error if truly unsupported
  }

  private processFiles(files: FileList | File[]): void {
    this.fileError = '';
    Array.from(files).forEach((file) => {
      if (file.size > this.MAX_FILE_SIZE) {
        this.fileError = `"${file.name}" exceeds the 15 MB limit.`;
        return;
      }
      const mimeType = this.resolveGeminiMimeType(file);
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        this.pendingFiles = [...this.pendingFiles, { name: file.name, mimeType, base64Data }];
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  protected onAttachClick(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.processFiles(input.files);
    input.value = '';
  }

  protected removeFile(index: number): void {
    this.pendingFiles = this.pendingFiles.filter((_, i) => i !== index);
  }

  protected onChatDragOver(event: DragEvent): void {
    const hasFiles = event.dataTransfer?.types.includes('Files');
    if (!hasFiles) return;
    event.preventDefault();
    this.isDragOver = true;
  }

  protected onChatDragLeave(event: DragEvent): void {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      this.isDragOver = false;
    }
  }

  protected onChatDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files.length) {
      this.processFiles(event.dataTransfer.files);
    }
  }

  protected async sendMessage() {
    if (!this.canSend) {
      return;
    }

    this.thinkingGroupId++;

    const filesToSend = [...this.pendingFiles];
    const attachments: AttachedFile[] = filesToSend.map(({ name, mimeType }) => ({ name, mimeType }));

    this.messages.push({
      role: 'user',
      content: this.chatInput,
      attachments: attachments.length ? attachments : undefined,
    });
    this.thinking = true;
    this.fileError = '';
    const userMessage = this.chatInput;
    this.chatInput = '';
    this.pendingFiles = [];

    const groupId = this.thinkingGroupId;
    const response = await this.ai.sendMessage(userMessage, filesToSend, (thought) => {
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
    if ('locale' in flatData) this.formLocale.set(flatData['locale'] as string);
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
