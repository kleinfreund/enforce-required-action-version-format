import { parse } from 'yaml'

/** @typedef {{ uses?: string }} Step */
/** @typedef {{ uses?: string, steps?: Step[] }} Job */
/** @typedef {{ jobs?: Record<string, Job> }} WorkflowYaml */
/** @typedef {'sha-1' | 'sha-256'} ShaVersionFormat */
/** @typedef {ShaVersionFormat | 'release-tag-or-branch-name' | 'docker-tag'} VersionFormat */
/** @typedef {{ action: string, version: string, format: VersionFormat }} Issue */

/**
 * Check the action for any uses statements that don't use the required version format.
 *
 * @param {string} content
 * @param {ShaVersionFormat} requiredVersionFormat
 * @returns {Issue[]}
 */
export function checkAction (content, requiredVersionFormat) {
	const yaml = /** @type {WorkflowYaml} */ (parse(content))
	/** @type {Array<VersionFormat>} */
	const allowedVersionFormats = requiredVersionFormat === 'sha-256'
		? ['sha-256']
		: ['sha-1', 'sha-256']

	/** @type {Issue[]} */
	const issues = []
	if (yaml.jobs) {
		for (const job of Object.values(yaml.jobs)) {
			issues.push(...getIssues(job.uses, allowedVersionFormats))

			if (Array.isArray(job.steps)) {
				for (const step of job.steps) {
					issues.push(...getIssues(step.uses, allowedVersionFormats))
				}
			}
		}
	}

	return issues
}

/**
 * Validate a “uses” statement again a list of allowed version formats
 *
 * @param {unknown} uses
 * @param {Array<VersionFormat>} allowedVersionFormats
 * @returns {[Issue] | []}
 */
function getIssues (uses, allowedVersionFormats) {
	if (typeof uses === 'string') {
		if (uses.startsWith('docker://')) {
			if (uses.includes('@sha256:')) {
				const [action, version] = /** @type {[string, string]} */ (uses.split('@sha256:'))
				const format = getVersionFormat(version)
				if (!allowedVersionFormats.includes(format)) {
					return [{ action, version, format }]
				}
			} else {
				const secondColonPosition = uses.indexOf(':', 9)
				const action = uses.substring(0, secondColonPosition)
				const version = uses.substring(secondColonPosition + 1, uses.length)
				return [{ action, version, format: 'docker-tag' }]
			}
		} else if (uses.includes('@')) {
			const [action, version] = /** @type {[string, string]} */ (uses.split('@'))
			const format = getVersionFormat(version)
			if (!allowedVersionFormats.includes(format)) {
				return [{ action, version, format }]
			}
		}
	}

	return []
}

/**
 * @param {string} version
 * @returns {VersionFormat} the version format of a version reference
 */
function getVersionFormat (version) {
	if (/^[0-9a-f]{64}$/i.test(version)) {
		return 'sha-256'
	} else if (/^[0-9a-f]{40}$/i.test(version)) {
		return 'sha-1'
	}

	return 'release-tag-or-branch-name'
}
