import {
  AfterViewInit,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  ViewChild,
} from '@angular/core';
import * as monaco from 'monaco-editor';

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

self.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  standalone: true,
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLDivElement>;

  value = input<string>('');
  valueChange = output<string>();

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;

  ngAfterViewInit() {
    this.configureJsonSchema();
    this.initializeEditor();
  }

  private configureJsonSchema() {
    monaco.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      enableSchemaRequest: true,
      schemas: [
        {
          uri: 'https://golemui.com/schemas/form.schema.json',
          fileMatch: ['form.json'], // Simplified match
        },
      ],
    });
  }

  private initializeEditor() {
    if (!this.editorContainer) {
      return;
    }

    // 1. Create a URI for the model so it matches the 'fileMatch' above
    const modelUri = monaco.Uri.parse('internal://server/form.json');

    // 2. Check if a model already exists to avoid "Model already exists" errors on hot-reload
    let model = monaco.editor.getModel(modelUri);
    if (!model) {
      model = monaco.editor.createModel(this.value(), 'json', modelUri);
    }

    // 3. Initialize the editor using the 'model' property instead of 'value'/'language'
    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      model: model,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      formatOnPaste: true,
      formatOnType: true,
      tabSize: 2,
    });

    this.editor.onDidChangeModelContent(() => {
      this.valueChange.emit(this.editor?.getValue() || '');
    });
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.dispose();
      const modelUri = monaco.Uri.parse('internal://server/form.json');
      monaco.editor.getModel(modelUri)?.dispose();
    }
  }
}
