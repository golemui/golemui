import type { MarkdownParser, UploadService } from '@golemui/gui-components';

// The file value and service types belong to the gui-* elements.
export type {
  FileItem,
  FileStatus,
  MarkdownParser,
  SanitizedHtml,
  UploadService,
} from '@golemui/gui-components';

/**
 * Dependencies are any 3rd party service components may need internally.
 * e.g. a markdown parser for the Markdown component
 *
 * This type lists the dependency keys that the gui components read.
 */
export type Dependencies = {
  /**
   * The markdown parser used by the markdown and markdownText components. Its output is inserted
   * as HTML without sanitizing, see `MarkdownParser`.
   */
  markdown?: MarkdownParser;
  /**
   * The upload transport used by the fileUpload and multiFileUpload components.
   */
  uploadService?: UploadService;
};
