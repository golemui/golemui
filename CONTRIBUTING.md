# Contributing to GolemUI

First off, thanks for taking the time to contribute! Every contribution helps make GolemUI better, whether it's reporting a bug, improving documentation, or submitting a pull request.

This document outlines how to get involved. Please read it before opening an issue or PR.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

## How Can I Contribute?

### Asking Questions

For general questions, ideas, or open-ended discussion, please use [GitHub Discussions](https://github.com/golemui/golemui/discussions) rather than opening an issue.

### Reporting Bugs

Before filing a bug report:

- Search the [existing issues](https://github.com/golemui/golemui/issues) to make sure it hasn't been reported yet.
- Make sure you're on the latest version of GolemUI.
- Try to reproduce the issue in a minimal example (e.g. a StackBlitz or CodeSandbox).

When you're ready, open a new issue using the **Bug report** template. The more detail you provide (steps to reproduce, environment, screenshots), the faster we can help.

### Suggesting Features

Feature requests are welcome. Use the **Feature request** issue template and describe:

- The problem you're trying to solve.
- The solution you'd like to see.
- Any alternatives you've considered.

Please open a discussion first for large or cross-cutting changes — it avoids wasted work if the direction needs adjustment.

### Reporting Security Vulnerabilities

**Do not open a public issue for security problems.** Follow the process described in [SECURITY.md](./SECURITY.md).

## Pull Request Workflow

1. **Fork** the repository and create your branch from `main`.
2. **Install dependencies** and make sure the project builds locally (see [Development Setup](#development-setup)).
3. **Make your changes** following the conventions in this document.
4. **Add tests** for any new behaviour or bug fix.
5. **Run the test suite** locally and make sure everything passes.
6. **Update the documentation** if your change affects public API or user-facing behaviour.
7. **Open a Pull Request** against `main`. Fill in the PR template completely.

PRs are reviewed by maintainers. Expect feedback and possible requests for changes; this is normal and part of keeping the codebase healthy. Once approved and all checks are green, a maintainer will merge it.

### Squash Merge & PR Title

This repository uses **squash merges** exclusively. When your PR is merged, all commits on your branch are collapsed into a single commit whose message is taken directly from the **PR title**. That commit is what lands on `main` and what the release pipeline reads.

This means: **your PR title is your commit message.** It must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```text
type(scope): subject
```

A **Validate PR title** GitHub Actions check enforces this automatically and will block the merge if the title is invalid. See [Commit Messages](#commit-messages) for the full list of allowed types and examples.

Good PR titles:

```text
feat(react): add Tooltip component
fix(angular): correct focus trap on Dialog close
docs: clarify peerDependencies section
chore: bump Nx to 21
```

Individual commits on your branch are squashed away and don't need to follow any format, only the PR title matters for the changelog and version bump.

### Keep PRs Focused

One PR should address one concern. If you find unrelated bugs along the way, please open separate PRs for them. Smaller PRs get reviewed and merged faster.

## Development Setup

### Prerequisites

- **Node.js** ≥ 20 (LTS recommended)
- **npm** ≥ 10 (or the package manager configured for the repo)
- **Git**

### Getting Started

```bash
# Clone your fork
git clone https://github.com/<your-username>/golemui.git
cd golemui

# Install dependencies
npm install

# Build all packages
npm run build:libs

# Run the test suite
npm run test:all
```

### Running a Specific Package

GolemUI is an Nx monorepo with packages for each supported framework (React, Angular, Lit, etc.). We recommend test your changes in one of the available playground apps:

```bash
# Run the app
npx nx run angular-playground:serve
npx nx run react-playground:serve
npx nx run lit-playground:serve
npx nx run vue-playground:serve
npx nx run nuxt-playground:serve   # server-rendered (Nuxt)
```

### Running Cypress Tests

Run Cypress tests when you have finished your work. To run them:

```bash
# Test a single framework with cypress
npm run test:angular
npm run test:react
npm run test:lit
```

## Coding Conventions

### Code Style

Code style is enforced by ESLint and Prettier. Run the linter and formatter before committing:

```bash
npm run lint
npm run format
```

Most editors can be set up to format on save — this is the smoothest experience.

### Export conventions

| Convention        | Rule                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| No `export *`     | Explicit named re-exports only in every `src/index.ts` and barrel       |
| `export type`     | Type-only exports (interfaces, types, enums) must use `export type { }` |
| `/internals`      | Cross-package symbols only; end-users must not import from here         |
| Module boundaries | Imports flow one way: `app → framework → gui → core`                    |

When in doubt: start in `src/internals.ts` — promoting to public is non-breaking, demoting is not.

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). The format is:

```text
<type>(<scope>): <subject>
```

To help you write your commits we recommend you to use Commitizen:

```bash
npm run cz
```

Common types:

- `feat`: a new feature
- `fix`: a bug fix
- `docs`: documentation only
- `refactor`: code change that neither fixes a bug nor adds a feature
- `test`: adding or correcting tests
- `chore`: tooling, build, dependencies
- `perf`: performance improvement

Examples:

```text
feat(react): add Tooltip component
fix(angular): correct focus trap on Dialog close
docs(readme): clarify peerDependencies section
```

This is important because our release process (`nx release`) generates the changelog from commit messages, so a good message ends up in the public release notes.

### Branch Naming

Use descriptive branch names, optionally prefixed:

- `feat/tooltip-react`
- `fix/dialog-focus-trap`
- `docs/peer-deps`

### Tests

- Add unit tests for new logic.
- Add Cypress tests for new component behaviour.
- Existing tests must keep passing — if a change breaks a test, either fix the test (if behaviour is intentionally changing) or fix the regression.

## License

By contributing to GolemUI, you agree that your contributions will be licensed under the same license as the package you're contributing to (MIT for open-source packages). See [LICENSE](./LICENSE) for details.

## Recognition

All contributors are listed in our release notes and on the project page. Thank you for helping make GolemUI better!
