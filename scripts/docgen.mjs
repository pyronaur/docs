import fs from 'fs';
import fetch from 'node-fetch';
import jsdoc from 'jsdoc-api';

// Fill this in to test a response locally, with fetching.
const STUB = ``;
const HEADER = `---
# NOTE: This file is auto-generated from 'scripts/docgen.mjs'
# Do not make edits to it directly, they will be overwritten.

layout: ~/layouts/MainLayout.astro
title: Configuration Reference
---

To configure Astro, add an \`astro.config.mjs\` file to the root of your project.

\`\`\`js
export default /** @type {import('astro').AstroUserConfig} */ ({
  // all options are optional; these values are the defaults
  projectRoot: './',
  public: './public/',
  dist: './dist/',
  src: './src/',
  pages: './src/pages/',
  renderers: [
    '@astrojs/renderer-svelte',
    '@astrojs/renderer-vue',
    '@astrojs/renderer-react',
    '@astrojs/renderer-preact',
  ],
  vite: {},
});
\`\`\`
`;

const FOOTER = ``;

/**
 * The simple demo does not rely on the TypeScript compiler API; instead, it parses the
 * source file directly.  It uses the default parser configuration.
 */
export async function run() {
    const inputBuffer = STUB || await fetch('https://raw.githubusercontent.com/withastro/astro/main/packages/astro/src/%40types/astro.ts').then(r => r.text());

    // Get all `@docs` JSDoc comments in the file. 
    const allComments = [...inputBuffer.matchAll(/\/\*\*\s*\n([^\*]|\*[^\/])*@docs([^\*]|\*[^\/])*\*\//g)];
    const allCommentsInput = allComments.map(m => m[0]).filter(c => c.includes('* @docs')).join('\n\n');

    console.log(jsdoc);
    console.log(allCommentsInput);
    console.log(jsdoc.explainSync({ source: allCommentsInput }))

    const allParsedComments = jsdoc.explainSync({ source: allCommentsInput }).filter(data => data.tags);

    let result = ``;

    for (const comment of allParsedComments) {
        if (comment.kind === 'heading') {
            result += (`## ${comment.name}\n\n`);
            continue;
        }
        for (const propertyCheck of ['name', 'type']) {
            if (!comment[propertyCheck]) {
                throw new Error(`Missing @docs JSDoc tag: @${propertyCheck}`);
            }
        }
        const cliFlag = comment.tags.find(f => f.title === 'cli');
        console.log(comment);
        result += [
            `### ${comment.name}`,
            ``,
            `**Type:** \`${comment.type.names.join(' | ')}\`${'  '}`,
            cliFlag ? `**CLI:** \`${cliFlag.text}\`${'  '}` : undefined,
            comment.defaultvalue ? `**Default:** ${comment.defaultvalue}${'  '}`.trim() : undefined,
            ``,
            comment.description && comment.description.trim(),
            comment.see ? `**See Also:**\n${comment.see.map(s => `- ${s}`.trim()).join('\n')}` : undefined,
            `\n\n`,
        ].filter(l => l !== undefined).join('\n');
    }

    console.log(result);
    fs.writeFileSync('src/pages/en/reference/configuration-reference.md', HEADER + result + FOOTER, 'utf8');
}

run();