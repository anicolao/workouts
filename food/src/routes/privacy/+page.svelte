<div class="privacy-container">
    <h1>Privacy Policy for Food Sheets</h1>
    <p class="last-updated"><strong>Last Updated:</strong> January 18, 2026</p>

    <section>
        <h2>The Short Version</h2>
        <p><strong>Food Sheets</strong> is an Open Source application designed with a "Privacy First" architecture.</p>
        <ul>
            <li><strong>No Developer Servers:</strong> We do not own a database. We do not store your data.</li>
            <li><strong>Your Drive, Your Data:</strong> All food logs, photos, and nutrition stats are saved directly to <em>your</em> personal Google Drive.</li>
            <li><strong>Sandboxed Access:</strong> The app is restricted so it can <em>only</em> access the specific files it creates. It cannot read your other personal spreadsheets or documents.</li>
        </ul>
    </section>

    <hr />

    <section>
        <h2>1. Data Collection and Storage Architecture</h2>
        
        <h3>Sandboxed Google Drive Access</h3>
        <p>We utilize the <code>drive.file</code> permission scope, which provides a "Strictly Sandboxed" level of access.</p>
        <ul>
            <li><strong>What we DO:</strong> The application creates a specific Google Sheet (for your logs) and a folder (for your food photos) in your Google Drive. We can read and edit <em>only</em> these specific files.</li>
            <li><strong>What we DO NOT:</strong> We have absolutely no access to existing spreadsheets, tax documents, or any other files in your Google Drive that were not created by Food Sheets.</li>
        </ul>

        <h3>Photos and Camera</h3>
        <p>We use the system's native Photo Picker (<code>photospicker.mediaitems.readonly</code>).</p>
        <ul>
            <li><strong>User-Initiated Only:</strong> The application does not have general access to your camera roll. It can only process the specific images you explicitly tap to select for analysis.</li>
            <li><strong>No Background Scanning:</strong> We <strong>cannot</strong> scan or access your library in the background.</li>
        </ul>
    </section>

    <section>
        <h2>2. Artificial Intelligence & Semantic Memory</h2>
        <p>To estimate calories, Food Sheets uses the <strong>Google Gemini API</strong>.</p>

        <h3>Image Analysis</h3>
        <p>We utilize the <code>generative-language.retriever</code> permission scope to access the Gemini API.</p>
        <p>When you select a food photo, it is sent to the Gemini API for analysis.</p>
        <ul>
            <li><strong>Direct Connection:</strong> The app connects directly to Google's API using your personal credentials. No developer server sits in the middle.</li>
            <li><strong>Data Usage:</strong> Your data is subject to <a href="https://ai.google.dev/gemini-api/terms" target="_blank">Google's Gemini API Terms</a>. If you are using a standard free Google Account, Google may use anonymized data to improve their models.</li>
            <li><strong>Retention:</strong> Google may temporarily retain API logs for abuse monitoring.</li>
        </ul>


    </section>

    <section>
        <h2>3. Account & Authorization</h2>

        <h3>Google Sign-In (OAuth)</h3>
        <p>We use Google OAuth 2.0 to authenticate you. This allows the application to act as an agent on your behalf using your own Google Account.</p>
        <ul>
            <li><strong>Your Control:</strong> You authorize the application to perform specific actions (like "Save to Drive") using your own account's quota.</li>
            <li><strong>No Password Access:</strong> We never see or store your Google password. The authorization is handled securely via a token stored in your device's secure keychain.</li>
        </ul>
    </section>

    <section>
        <h2>4. Third-Party Services & Compliance</h2>
        <p>The application relies on the following platform services to function:</p>
        <ul>
            <li><strong>Google Drive API:</strong> For file storage.</li>
            <li><strong>Google Gemini API:</strong> For nutritional analysis and memory.</li>
        </ul>

        <h3>Google Limited Use Policy</h3>
        <p>Food Sheets' use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
    </section>

    <section>
        <h2>5. Analytics and Tracking</h2>
        <p>To maintain strict privacy:</p>
        <ul>
            <li><strong>No Third-Party Analytics:</strong> We do not use tools like Google Analytics, Mixpanel, or Facebook Pixel.</li>
            <li><strong>No Advertising ID:</strong> We do not collect your device's Advertising ID.</li>
            <li><strong>Crash Reporting:</strong> Minimal anonymous crash logs may be sent to Apple/Google (based on your system settings) to help us fix bugs, but these contain no personal health data.</li>
        </ul>
    </section>

    <section>
        <h2>6. AI Accuracy Disclaimer</h2>
        <p>This application uses Artificial Intelligence to estimate nutritional information.</p>
        <ul>
            <li><strong>Estimates Only:</strong> AI-generated calorie and macro counts are estimates and may not be 100% accurate.</li>
            <li><strong>Not Medical Advice:</strong> Do not rely on these estimates for critical medical decisions (e.g., insulin dosing). Always verify the data manually if you have strict dietary requirements.</li>
        </ul>
    </section>

    <section>
        <h2>7. Your Rights (Data Deletion)</h2>
        <p>Since your data resides in your own Google Drive and Gemini Corpus:</p>
        <ol>
            <li><strong>Full Control:</strong> You can delete your "Food Sheets" folder in Google Drive at any time to remove your logs.</li>
            <li><strong>Revoking Access:</strong> You can revoke the app's access to your account at any time via your Google Account security settings (<code>myaccount.google.com/permissions</code>).</li>
        </ol>
    </section>

    <section>
        <h2>8. Changes to This Policy</h2>
        <p>Because the code is Open Source, any changes to how data is handled will be visible in the public code repository. If we make material changes to this policy, we will notify users through an app update.</p>
    </section>

    <section>
        <h2>9. Contact Us</h2>
        <p>If you have questions about this privacy policy or the open-source nature of the project, please contact:</p>
        <p><strong>Alex Nicolaou / <a href="mailto:alex@stockgamblers.com">alex@stockgamblers.com</a></strong><br>
        <a href="https://github.com/anicolao/food">https://github.com/anicolao/food</a></p>
    </section>
</div>

<style>
    .privacy-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.6;
    }

    h1 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }

    .last-updated {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 2rem;
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 2.5rem;
        margin-bottom: 1rem;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-light);
        padding-bottom: 0.5rem;
    }

    h3 {
        font-size: 1.2rem;
        font-weight: 600;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        color: var(--text-primary);
    }

    p {
        margin-bottom: 1rem;
    }

    ul, ol {
        margin-bottom: 1.5rem;
        padding-left: 1.5rem;
    }

    li {
        margin-bottom: 0.5rem;
    }

    code {
        background: var(--bg-secondary);
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9em;
    }

    hr {
        margin: 2rem 0;
        border: 0;
        border-top: 1px solid var(--border-light);
    }
    
    a {
        color: var(--accent-primary);
        text-decoration: underline;
    }
</style>
