# Security Policy

We take the security of GolemUI seriously. This document explains how to report vulnerabilities and what versions we support.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Use GitHub's built-in private reporting feature:

1. Go to the [Security tab](https://github.com/golemui/golemui/security/advisories) of this repository.
2. Click **"New draft security advisory"**.
3. Fill in the form with as much detail as possible.

This creates a private advisory visible only to maintainers.

## What to Include

To help us triage quickly, please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce, ideally with a minimal proof-of-concept.
- The affected version(s) of GolemUI.
- The environment (browser, framework, Node version, etc.) where it was found.
- Any suggested mitigation or fix, if you have one.

## Scope

**In scope:**

- The source code in this repository.
- Published npm packages under the `@golemui/*` scope.
- Official documentation and example sites maintained by us.

**Out of scope:**

- Vulnerabilities in third-party dependencies (please report those to the dependency maintainers — we will update once a fix is available upstream).
- Issues that require physical access to a user's device.
- Social engineering of GolemUI maintainers or users.
- Denial of service through unrealistic input volumes.
- Issues in forks or unofficial distributions.

## Disclosure Policy

We follow **coordinated disclosure**:

1. You report the issue privately.
2. We confirm, develop a fix, and prepare a release.
3. We publish a GitHub Security Advisory and a patched version simultaneously.
4. Public disclosure happens **after** users have had reasonable time to upgrade (typically 7 days after the patched release).

We ask reporters not to publicly disclose the issue until coordinated disclosure has happened.

## Recognition

With your permission, we will credit you in the published security advisory and in the release notes. If you prefer to remain anonymous, just let us know.

We do not currently run a paid bug bounty program, but we genuinely appreciate responsible disclosure and will do our best to acknowledge your work publicly.

## Questions

For non-security questions about this policy, open a regular issue or discussion on GitHub.
