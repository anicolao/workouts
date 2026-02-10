import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');

// Patterns to look for
const HREF_REGEX = /href\s*=\s*["'](\/[^"']*)["']/;
const GOTO_REGEX = /goto\s*\(\s*["'](\/[^"']*)["']\s*\)/;

// Excluded paths (if any)
const EXCLUDES = [];

function scanDir(dir) {
    let hasErrors = false;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (scanDir(fullPath)) hasErrors = true;
        } else if (file.endsWith('.svelte') || file.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const relativePath = path.relative(path.resolve(__dirname, '..'), fullPath);

            // Check hrefs
            let match;
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                // Check for href="/..."
                if ((match = line.match(HREF_REGEX))) {
                    console.error(`ERROR: ${relativePath}:${i + 1}: Found absolute href without base path: ${match[0]}`);
                    console.error(`       Use {base} from '$app/paths' instead.`);
                    hasErrors = true;
                }
                // Check for goto('/...')
                if ((match = line.match(GOTO_REGEX))) {
                    console.error(`ERROR: ${relativePath}:${i + 1}: Found absolute goto without base path: ${match[0]}`);
                    console.error(`       Use \`\${base}${match[1]}\` instead.`);
                    hasErrors = true;
                }
            });
        }
    }
    return hasErrors;
}

console.log('Scanning for invalid base paths...');
if (scanDir(srcDir)) {
    console.error('FAILED: Found invalid base paths. Please use {base} from $app/paths.');
    process.exit(1);
} else {
    console.log('PASSED: No invalid base paths found.');
}
