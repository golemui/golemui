import { readFileSync } from 'node:fs';
import { checkDxCode } from './dx/check-dx-code';
import { validateFormDefinition } from './json/validate-form-definition';

/**
 * The `golemui-mcp` CLI subcommands — the same two terminal checks the MCP serves
 * (`json_validate_form_definition`, `dx_check_code`), runnable as one-off shell
 * commands (`npx -y @golemui/gui-mcp <cmd> <file>`) so agents can verify a form
 * without an MCP connector. Designed for agentic use: non-interactive, structured
 * JSON on stdout, diagnostics on stderr, documented exit codes.
 *
 * Exit codes: 0 = check passed · 1 = check found problems · 2 = usage/file error.
 */

export interface CliIo {
  out: (line: string) => void;
  err: (line: string) => void;
}

const USAGE = `Usage: golemui-mcp [command]

Validate GolemUI forms from the command line (no MCP client needed).
With no command, starts the MCP server on stdio.

Commands:
  validate-json <file.json>   Validate a JSON form definition ({ "form": [...] })
                              against the bundled GolemUI JSON Schemas.
  check-dx <file.ts>          Type-check a gui.* TypeScript snippet against the
                              real @golemui type declarations.
  help, --help, -h            Show this help.

Output: a single JSON result on stdout.
  validate-json → { valid, errors, warnings, expressionWarnings, interpolationWarnings }
  check-dx      → { ok, diagnostics, expressionWarnings, validatorWarnings }

Exit codes: 0 = valid/ok · 1 = invalid (fix the reported problems and re-run) ·
2 = usage or file error.

Examples:
  npx -y @golemui/gui-mcp validate-json signup-form.json
  npx -y @golemui/gui-mcp check-dx src/forms/signup.ts`;

function readFileOr2(path: string | undefined, what: string, io: CliIo): string | number {
  if (!path) {
    io.err(`Error: missing <file> argument — the path of the ${what} to check.`);
    io.err(USAGE);
    return 2;
  }
  try {
    return readFileSync(path, 'utf-8');
  } catch (e) {
    io.err(`Error: cannot read ${path}: ${(e as Error).message}`);
    return 2;
  }
}

const defaultIo: CliIo = {
  out: (line) => process.stdout.write(line + '\n'),
  err: (line) => process.stderr.write(line + '\n'),
};

/**
 * Run one CLI subcommand. Returns the process exit code; never throws.
 * `argv` is `process.argv.slice(2)`.
 */
export async function runCli(argv: string[], io: CliIo = defaultIo): Promise<number> {
  const [command, fileArg] = argv;

  switch (command) {
    case 'help':
    case '--help':
    case '-h': {
      io.out(USAGE);
      return 0;
    }

    case 'validate-json': {
      const raw = readFileOr2(fileArg, 'JSON form definition', io);
      if (typeof raw === 'number') return raw;
      let formDefinition: unknown;
      try {
        formDefinition = JSON.parse(raw);
      } catch (e) {
        io.err(`Error: ${fileArg} is not valid JSON: ${(e as Error).message}`);
        return 2;
      }
      const result = validateFormDefinition({ formDefinition });
      io.out(JSON.stringify(result, null, 2));
      return result.valid ? 0 : 1;
    }

    case 'check-dx': {
      const code = readFileOr2(fileArg, 'gui.* TypeScript snippet', io);
      if (typeof code === 'number') return code;
      try {
        const result = await checkDxCode({ code });
        io.out(JSON.stringify(result, null, 2));
        return result.ok ? 0 : 1;
      } catch (e) {
        // Thrown (vs. diagnosed) failures are environmental: empty snippet, or the
        // @golemui type graph is unavailable and the check refuses to lie.
        io.err(`Error: ${(e as Error).message}`);
        return 2;
      }
    }

    default: {
      io.err(`Error: unknown command "${command}". Valid commands: validate-json, check-dx, help.`);
      io.err(USAGE);
      return 2;
    }
  }
}
