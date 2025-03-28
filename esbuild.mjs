#! /usr/bin/env node

import { build } from 'esbuild'

await build({
	entryPoints: ['src/index.mjs'],
	bundle: true,
	minify: true,
	platform: 'node',
	target: 'node20.19',
	format: 'cjs',
	outfile: 'dist/index.js',
})
