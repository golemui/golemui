import type { FileItem, UploadService } from '@golemui/gui-shared';

type PendingUpload = {
  file: File;
  id: string;
  signal: AbortSignal;
  progress: (pct: number) => void;
  resolve: () => void;
  reject: (message: string) => void;
};

export type MockUploadServiceOptions = {
  /** When true, uploads stay pending until `release()` / `fail()` are called. */
  manual?: boolean;
  /** Milliseconds an automatic upload takes. Defaults to 40. */
  delay?: number;
  /** Returns the rejection message for a file, or `undefined` to let it succeed. */
  failFor?: (file: File, attempt: number) => string | undefined;
  /** Builds the value stored in `FileItem.data`. Defaults to `{ url }`. */
  result?: (file: File, id: string) => unknown;
  /** `false` omits `remove` from the service; a function replaces the default resolving one. */
  remove?: false | ((item: FileItem) => Promise<void>);
};

/**
 * A controllable `uploadService` for the file upload suites. Records every
 * `upload`/`remove` call and, in `manual` mode, lets the test drive progress,
 * completion and failure of the oldest pending upload.
 */
export function createMockUploadService(options: MockUploadServiceOptions = {}) {
  const uploads: File[] = [];
  const removes: FileItem[] = [];
  const aborted: string[] = [];
  const pending: PendingUpload[] = [];
  const attempts = new Map<string, number>();

  const service: UploadService = {
    upload(file, ctx) {
      uploads.push(file);
      const attempt = (attempts.get(file.name) ?? 0) + 1;
      attempts.set(file.name, attempt);

      return new Promise<unknown>((resolve, reject) => {
        ctx.signal.addEventListener('abort', () => {
          aborted.push(ctx.id);
          reject(new DOMException('Upload aborted', 'AbortError'));
        });

        const entry: PendingUpload = {
          file,
          id: ctx.id,
          signal: ctx.signal,
          progress: (pct) => ctx.onProgress?.(pct),
          resolve: () =>
            resolve(options.result?.(file, ctx.id) ?? { url: `https://cdn.test/${file.name}` }),
          reject: (message) => reject(new Error(message)),
        };

        const failure = options.failFor?.(file, attempt);

        if (options.manual) {
          pending.push(entry);
          return;
        }

        const delay = options.delay ?? 40;
        setTimeout(() => entry.progress(50), delay / 2);
        setTimeout(() => (failure ? entry.reject(failure) : entry.resolve()), delay);
      });
    },
  };

  const customRemove = options.remove;
  if (customRemove !== false) {
    service.remove = async (item) => {
      removes.push(item);
      if (customRemove) await customRemove(item);
    };
  }

  return {
    service,
    uploads,
    removes,
    aborted,
    pending,
    /** Reports progress on the oldest pending upload. */
    progress: (pct: number) => pending[0]?.progress(pct),
    /** Completes the oldest pending upload. */
    release: () => pending.shift()?.resolve(),
    /** Fails the oldest pending upload with the given message. */
    fail: (message: string) => pending.shift()?.reject(message),
  };
}

export type MockUploadService = ReturnType<typeof createMockUploadService>;
