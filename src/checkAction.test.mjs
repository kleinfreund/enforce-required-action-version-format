import { describe, test, expect } from 'vitest'

import { checkAction } from './checkAction.mjs'

describe('checkAction', () => {
	test.each(/** @type {[string, Parameters<typeof checkAction>, ReturnType<typeof checkAction>][]} */ ([
		[
			'no uses + sha-1',
			[
				'{}',
				'sha-1',
			],
			[],
		],
		[
			'offending steps uses + sha-1',
			[
				`jobs:
  tests:
    steps:
      - uses: actions/action@v4
      - uses: actions/action@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
      - uses: actions/action@5a3ec84eff668545956fd18022155c47e93e2684012345678901234567890123
      - uses: docker://name/name:tag
      - uses: docker://name/name@sha256:5a3ec84eff668545956fd18022155c47e93e2684012345678901234567890123`,
				'sha-1',
			],
			[
				{ action: 'actions/action', version: 'v4', format: 'release-tag-or-branch-name' },
				{ action: 'docker://name/name', version: 'tag', format: 'docker-tag' },
			],
		],
		[
			'offending steps uses + sha-256',
			[
				`jobs:
  tests:
    steps:
      - uses: actions/action@v4
      - uses: actions/action@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
      - uses: actions/action@5a3ec84eff668545956fd18022155c47e93e2684012345678901234567890123
      - uses: docker://name/name:dist-tag
      - uses: docker://name/name:1.2.3
      - uses: docker://name/name@sha256:5a3ec84eff668545956fd18022155c47e93e2684012345678901234567890123`,
				'sha-256',
			],
			[
				{ action: 'actions/action', version: 'v4', format: 'release-tag-or-branch-name' },
				{ action: 'actions/action', version: 'cdca7365b2dadb8aad0a33bc7601856ffabcc48e', format: 'sha-1' },
				{ action: 'docker://name/name', version: 'dist-tag', format: 'docker-tag' },
				{ action: 'docker://name/name', version: '1.2.3', format: 'docker-tag' },
			],
		],
		[
			'offending jobs uses + sha-1',
			[
				`jobs:
  tests:
    uses: org/repo/.github/workflows/workflow.yml@v1
  release:
    uses: org/repo/.github/workflows/workflow.yml@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
  upload-artifacts:
    uses: org/repo/.github/workflows/workflow.yml@5a3ec84eff668545956fd18022155c47e93e2684012345678901234567890123`,
				'sha-1',
			],
			[
				{ action: 'org/repo/.github/workflows/workflow.yml', version: 'v1', format: 'release-tag-or-branch-name' },
			],
		],
		[
			'offending jobs uses + sha-256',
			[
				`jobs:
  tests:
    uses: org/repo/.github/workflows/workflow.yml@v1
  release:
    uses: org/repo/.github/workflows/workflow.yml@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
  upload-artifacts:
    uses: org/repo/.github/workflows/workflow.yml@5a3ec84eff668545956fd18022155c47e93e2684012345678901234567890123`,
				'sha-256',
			],
			[
				{ action: 'org/repo/.github/workflows/workflow.yml', version: 'v1', format: 'release-tag-or-branch-name' },
				{ action: 'org/repo/.github/workflows/workflow.yml', version: 'cdca7365b2dadb8aad0a33bc7601856ffabcc48e', format: 'sha-1' },
			],
		],
	]))('%s', (message, parameters, expected) => {
		expect(checkAction(...parameters)).toStrictEqual(expected)
	})
})
