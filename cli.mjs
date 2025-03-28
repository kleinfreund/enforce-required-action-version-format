#! /usr/bin/env node

import { globSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { checkAction } from './src/checkAction.mjs'
import { DEFAULT_PATTERNS, NAME } from './src/constants.mjs'

run()

/**
 * @typedef {{ patterns: string, 'required-version-format': 'sha-1' | 'sha-256', 'report-level': 'error' | 'warning' }} Args
 */

function run () {
	const args = parseArgs({
		options: {
			patterns: {
				type: 'string',
				default: DEFAULT_PATTERNS.join(','),
			},
			'required-version-format': {
				type: 'string',
				default: 'sha-1',
			},
			'report-level': {
				type: 'string',
				default: 'error',
			},
		},
	})
	const {
		patterns,
		'required-version-format': requiredVersionFormat,
		'report-level': reportLevel,
	} = /** @type {Args} */ (args.values)
	console.info(`[${NAME}] Checking actions for uses statements not using the required version format “${requiredVersionFormat}” …`)

	const paths = globSync(patterns.split(','))
		.map((path) => resolve(import.meta.dirname, path))
	if (paths.length === 0) {
		console.info(`[${NAME}] No actions found for patterns “${patterns}”.`)
		return
	}

	const result = paths
		.map((path) => {
			const content = readFileSync(path, { encoding: 'utf-8' })
			return {
				path,
				issues: checkAction(content, requiredVersionFormat),
			}
		})
		.filter(({ issues }) => issues.length > 0)

	if (result.length > 0) {
		for (const { path, issues } of result) {
			console.group(`\nFile: ${path}`)
			for (const { action, version, format } of issues) {
				console.info(`${action}@${version} (format: ${format})`)
			}
			console.groupEnd()
		}
	}

	if (result.length > 0) {
		const message = `\n[${NAME}] Some uses statements in the checked actions don’t use the “${requiredVersionFormat}” format.`

		if (reportLevel === 'error') {
			console.error(message)
			process.exitCode = 1
		} else {
			console.warn(message)
		}
	} else {
		console.info(`[${NAME}] All uses statements in the checked actions use the “${requiredVersionFormat}” format.`)
	}
}
