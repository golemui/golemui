// Bin entry of `@golemui/schemas`. The shebang is added by the build.
// Avoids top-level await so the same source also builds to CommonJS.
import { runCli } from './run.js';

runCli(process.argv.slice(2)).then((exitCode) => {
  process.exitCode = exitCode;
});
