import type {
  DxDefinitionItem,
  DxDefinitions,
  DxFormConfig,
  GslSelectorsInput,
} from '@golemui/gui-shared';
import { gui } from '@golemui/gui-shared';
import * as DxMocks from './index.dx';

const dxMock: DxModule = DxMocks.testsDxModule;

export interface DxModule {
  label: string;
  formDef: DxDefinitionItem[];
  formConfig?: DxFormConfig;
  data: Record<string, unknown>;
}

export interface ModularDx {
  data: Record<string, unknown>;
  formDef: DxDefinitions;
  formSelectors: GslSelectorsInput;
  formConfig: DxFormConfig;
}

export function buildModularDx(modules: DxModule[]): ModularDx {
  return {
    data: Object.assign({}, ...modules.map((m) => m.data)),
    formDef: [
      gui.layouts.tabs(
        modules.map((m) => ({
          label: m.label,
          children: m.formDef as any,
        })),
      ),
    ],
    formSelectors: [],
    formConfig: {
      states: Object.assign({}, ...modules.map((m) => m.formConfig?.states ?? {})),
      suppressAutomaticSubmit: true,
    },
  };
}

export const modularDx = buildModularDx([dxMock]);
