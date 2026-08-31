import type { UploadService } from '@golemui/gui-shared';

/**
 * Playground `uploadService`: simulates a slow upload with progress ticks and
 * fails any file whose name contains "fail", so the retry flow can be tried.
 * Keep it module-level: a new `dependencies` object identity would re-init the form.
 */
export const mockUploadService: UploadService = {
  upload(file, { onProgress, signal }) {
    return new Promise((resolve, reject) => {
      const duration = 1500 + Math.random() * 1500;
      let pct = 0;

      const ticker = setInterval(() => {
        pct = Math.min(95, pct + 4 + Math.random() * 8);
        onProgress?.(pct);
      }, 120);

      const finish = setTimeout(() => {
        clearInterval(ticker);
        if (/fail/i.test(file.name)) {
          reject(new Error('Simulated server error'));
          return;
        }
        onProgress?.(100);
        resolve({
          url: `https://cdn.example.com/uploads/${encodeURIComponent(file.name)}`,
          bytes: file.size,
        });
      }, duration);

      signal.addEventListener('abort', () => {
        clearInterval(ticker);
        clearTimeout(finish);
        reject(new DOMException('Upload aborted', 'AbortError'));
      });
    });
  },

  async remove(item) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    console.info('[mockUploadService] removed', item.name, item.data);
  },
};
