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
};
