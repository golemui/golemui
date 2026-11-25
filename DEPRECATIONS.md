# Deprecations

Every deprecated API of the GolemUI packages: what to use instead, and the release that removes
it. The release notes and the migration guide of a major version are written from this file.

- A PR that deprecates an API adds its row here, in the same PR. The API's TSDoc gets a
  `@deprecated` tag that says what to use instead and, when it is set, the version that removes
  it. A JSON Schema property also gets `"deprecated": true`.
- A PR that removes an API deletes its row, and the major version's migration guide gets an entry.
- "Next release" means the deprecation is on `main` but not released yet. The release that ships
  it replaces those words with its version.

## Removed in v3.0.0

| API | Package | Deprecated in | Use instead | Why |
| --- | ------- | ------------- | ----------- | --- |
