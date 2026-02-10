import { type Page, type TestInfo, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export class TestStepHelper {
    private stepCount = 0;
    private documentation: string[] = [];
    private title: string = '';
    private userStory: string = '';

    constructor(private page: Page, private testInfo: TestInfo) { }

    setMetadata(title: string, userStory: string) {
        this.title = title;
        this.userStory = userStory;
        this.documentation.push(`# ${title}\n\n**User Story**: ${userStory}\n`);
    }

    async step(name: string, options: { description: string; verifications: { spec: string; check: () => Promise<void> }[] }) {
        const stepIndex = this.stepCount++;
        const screenshotName = `${String(stepIndex).padStart(3, '0')}-${name}.png`;

        // 1. Perform Verifications
        for (const verification of options.verifications) {
            await verification.check();
        }

        // 2. Capture & Verify (Zero-Pixel Tolerance)
        // This will check against the baseline in 'screenshots/{filename}'.
        await expect(this.page).toHaveScreenshot(screenshotName);

        // 3. Document
        this.documentation.push(`## Step ${stepIndex}: ${options.description}`);
        this.documentation.push(`![Screenshot](./screenshots/${screenshotName})`);
        this.documentation.push(`\n**Verifications:**`);
        options.verifications.forEach(v => this.documentation.push(`- [x] ${v.spec}`));
        this.documentation.push('\n---\n');
    }

    generateDocs() {
        const docPath = path.join(path.dirname(this.testInfo.file), 'README.md');
        fs.writeFileSync(docPath, this.documentation.join('\n'));
    }
}
