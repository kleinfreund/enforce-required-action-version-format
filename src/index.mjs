import { readFileSync } from 'node:fs'

import core from '@actions/core'
import { create as createGlobber } from '@actions/glob'

import { checkAction } from './checkAction.mjs'
import { DEFAULT_PATTERNS, NAME } from './constants.mjs'

async function run () {
	const patterns = core.getInput('patterns') || DEFAULT_PATTERNS.join('\n')
	const requiredVersionFormat = /** @type {'sha-1' | 'sha-256'} */ (core.getInput('required-version-format') || 'sha-1')
	const reportLevel = /** @type {'error' | 'warning'} */ (core.getInput('report-level') || 'error')
	core.info(`[${NAME}] Checking actions for uses statements not using the required version format “${requiredVersionFormat}” …`)

	const globber = await createGlobber(patterns, {
		followSymbolicLinks: false,
		implicitDescendants: false,
		matchDirectories: false,
	})
	const paths = await globber.glob()
	if (paths.length === 0) {
		core.info(`[${NAME}] No actions found for patterns “${patterns}”.`)
		core.setOutput('result', '[]')
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
	core.setOutput('result', result)

	if (result.length > 0) {
		for (const { path, issues } of result) {
			core.startGroup(`File ${path}:`)
			for (const { action, version, format } of issues) {
				core.info(`${action}@${version} (format: ${format})`)
			}
			core.endGroup()
		}
	}

	if (result.length > 0) {
		const errorMessage = `[${NAME}] Some uses statements in the checked actions don’t use the “${requiredVersionFormat}” format.`

		if (reportLevel === 'error') {
			core.setFailed(errorMessage)
		} else {
			core.warning(errorMessage)
		}
	} else {
		core.info(`[${NAME}] All uses statements in the checked actions use the “${requiredVersionFormat}” format.`)
	}
}

run()
