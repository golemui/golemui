/**
 * Upload lifecycle of one file as tracked in the form value. `uploading` and
 * `error` items block submission while `blockPendingUploads` is on (the
 * default) so a half-finished upload can never be submitted silently.
 */
export type FileStatus = 'uploading' | 'uploaded' | 'error';

/**
 * The value held by the `fileUpload` (one item or `null`) and
 * `multiFileUpload` (an array) widgets. It is plain JSON: the `File` object
 * never enters the form state, only this envelope does. `data` is whatever the
 * host's `uploadService.upload` resolved with, stored verbatim, so a submit
 * payload carries exactly what the host's own endpoint returned.
 */
export type FileItem<TData = unknown> = {
  /** Synthetic id generated when the file is added; stable across progress/retry. */
  id: string;
  name: string;
  /** Size in bytes. */
  size: number;
  /** Best-effort MIME type as reported by the browser. */
  type: string;
  status: FileStatus;
  /** Human-readable reason when `status === 'error'`. */
  error?: string;
  /** The server response, verbatim. */
  data?: TData;
};

/**
 * Transport for the file upload widgets, provided by the host. The widget
 * calls `upload` as soon as a file is picked and stores the resolved value in
 * `FileItem.data`; `remove` (optional) is awaited when the user removes an
 * uploaded file so the server can delete it.
 *
 * Keep the object reference stable (module level or memoized): a new form
 * `config` identity re-initializes the form.
 */
export type UploadService = {
  upload(
    file: File,
    ctx: {
      id: string;
      path: string;
      onProgress?: (percentage: number) => void;
      signal: AbortSignal;
    },
  ): Promise<unknown>;
  remove?(item: FileItem): Promise<void>;
};

/**
 * Dependencies are any 3rd party service components may need internally.
 * e.g. a markdown parser for the Markdown component
 *
 * This is the gui widget set's narrowing of the open `Dependencies` shape
 * declared by `@golemui/dx`, listing the keys the gui components read.
 */
export type Dependencies = {
  /**
   * The markdown parser used by the markdown component
   * Popular options are Snarkdown, Micromark and Marked.
   */
  markdown?: {
    parse: (markdown: string) => string;
  };
  /**
   * The upload transport used by the fileUpload and multiFileUpload components.
   */
  uploadService?: UploadService;
};
