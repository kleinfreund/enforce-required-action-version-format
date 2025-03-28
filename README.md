# enforce-required-action-version-format

[![Main passing](https://github.com/kleinfreund/enforce-required-action-version-format/workflows/Main/badge.svg)](https://github.com/kleinfreund/enforce-required-action-version-format/actions)

Enforces the required version format for GitHub Actions uses statements referencing third-party actions as recommended by GitHub in [Security hardening for GitHub Actions: Using third-party actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#using-third-party-actions).

- Checks workflow and composite action files by default. File patterns can be customized (see [patterns](#patterns)).
- Supports “sha-1” and “sha-256” version reference formats (see [required-version-format](#required-version-format)).

## Content

- [Note-worthy behavior](#note-worthy-behavior)
- [Usage](#usage)
- [Workflow permissions](#workflow-permissions)
- [Inputs](#inputs)
	- [patterns](#patterns)
	- [required-version-format](#required-version-format)
	- [report-level](#report-level)
- [Outputs](#outputs)
	- [result](#result)
- [Development](#development)
	- [CLI](#cli)
- [Releasing](#releasing)


## Note-worthy behavior & omissions

- Ignores uses statements that don't contain an “@” character (e.g. `uses: ./.github/actions/action`, `uses: docker://alpine:3.8`, `uses: docker://ghcr.io/owner/image_name`).
- Only checks files in patterns and doesn't try and resolve uses statements. You can specify patterns such that all local actions are checked.
- Doesn't verify whether any used version references actually correspond to an existing release for that action. I don't believe this action should check out arbitrary third party repositories to do so as that itself seems like a security risk.

## Usage

**Basic usage**

```yaml
      - uses: actions/checkout@v4
      - uses: kleinfreund/enforce-required-action-version-format@v1
```

**Usage with all inputs**:

```yaml
      - uses: actions/checkout@v4
      - uses: kleinfreund/enforce-required-action-version-format@v1
        with:
          patterns: |
            .github/workflows/*.yml
            .github/workflows/*.yaml
            .github/actions/**/*.yml
            .github/actions/**/*.yaml
          required-version-format: sha-256
          report-level: warning
```

## Workflow permissions

This action doesn't require any permissions, but it does require the repository whose actions are to be checked to be checked out and so you'll need `contents: read` (e.g.  `actions/checkout`).

## Inputs

### patterns

- **Description**: Glob patterns for where to look for action files. By default, this action only considers files inside “.github/workflows” and “.github/actions” with the extensions “.yml” or “.yaml”. Must be a string separated by newlines (i.e. “\n”). Doesn’t follow symbolic links. Uses the `@actions/glob` package (see https://github.com/actions/toolkit/tree/main/packages/glob).
- **Required**: no
- **Default**: `.github/workflows/*.yml\n.github/workflows/*.yaml\n.github/actions/**/*.yml\n.github/actions/**/*.yaml`

### required-version-format

- **Description**: Required version format. One of “sha-1” or “sha-256”. Using “sha-1” implies that both “sha-1” and “sha-256” formats are allowed. Using “sha-256” implies that only the “sha-256” format is allowed.
- **Allowed values**: `sha-1` or `sha-256`
- **Required**: no
- **Default**: `sha-1`

### report-level

- **Description**: Whether offending uses are reported as errors or warnings.
- **Allowed values**: `error` or `warning`
- **Required**: no
- **Default**: `error`

## Outputs

### result

- **Description**: A list of action file paths and their offending uses statements.
- **Example**:

	```json
	[
		{
			"path": "/Users/kleinfreund/dev/balatrolator.com/.github/workflows/deploy.yml",
			"issues": [
				{
					"action": "actions/checkout",
					"version": "v4",
					"format": "release-tag-or-branch-name"
				},
				{
					"action": "actions/setup-node",
					"version": "v4",
					"format": "release-tag-or-branch-name"
				},
				{
					"action": "actions/cache",
					"version": "v4",
					"format": "release-tag-or-branch-name"
				},
				{
					"action": "actions/upload-pages-artifact",
					"version": "v3",
					"format": "release-tag-or-branch-name"
				},
				{
					"action": "actions/deploy-pages",
					"version": "v4",
					"format": "release-tag-or-branch-name"
				}
			]
		},
		{
			"path": "/Users/kleinfreund/dev/balatrolator.com/.github/workflows/tests.yml",
			"issues": [
				{
					"action": "actions/checkout",
					"version": "v4",
					"format": "release-tag-or-branch-name"
				},
				{
					"action": "actions/setup-node",
					"version": "v4",
					"format": "release-tag-or-branch-name"
				},
				{
					"action": "actions/cache",
					"version": "v4",
					"format": "release-tag-or-branch-name"
				}
			]
		}
	]
	```

## Development

### CLI

**Basic usage**:

```sh
node cli.js
```

**Usage with all arguments**:

The arguments are named and behave exactly like those of the GitHub Action except for `patterns` which is comma-separated instead of newline-separated.

```sh
node cli.js \
	--patterns '../balatrolator.com/.github/workflows/*.yml,../balatrolator.com/.github/workflows/*.yaml' \
	--required-version-format sha-256 \
	--report-level warning
```

## Releasing

See also [Creating a JavaScript action: Commit, tag, and push your action](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action).

1. Commit all changes that should be part of the release.
2. Tag the commit with a release version and push all changes and tags.

	 ```sh
	 git tag --annotate v1.2.3
	 git push --follow-tags
	 ```

3. Update the major version tag to point to the latest release and push the major version tag with `--force` to overwrite the existing one.

	 ```sh
	 git tag --force v1 v1.2.3
	 git push origin v1 --force
	 ```
