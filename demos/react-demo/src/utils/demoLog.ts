export interface DemoLogEntry {
  timestamp: string;
  label: string;
  args: any[];
}

export type DemoLogFn = (label: string, ...args: any[]) => void;
