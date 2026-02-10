import { GOOGLE_CLIENT_ID } from './auth';

// Helper to load the Google Picker API (gapi)
// GIS (accounts.oauth2) handles auth, but Picker still lives in gapi.client
/* eslint-disable @typescript-eslint/no-explicit-any */

let pickerApiLoaded = false;
let gapiScriptLoaded = false;

function injectGapiScript(): Promise<void> {
    if ((window as any).gapi) {
        return Promise.resolve();
    }
    if (gapiScriptLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            gapiScriptLoaded = true;
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google API'));
        document.body.appendChild(script);
    });
}

export async function loadPickerApi() {
    if (pickerApiLoaded) return Promise.resolve();

    await injectGapiScript();

    return new Promise<void>((resolve) => {
        (window as any).gapi.load('picker', () => {
            pickerApiLoaded = true;
            resolve();
        });
    });
}

export enum PickType {
    FILE = 'FILE',
    FOLDER = 'FOLDER'
}

export async function openDrivePicker(oauthToken: string, folderId?: string, type: PickType = PickType.FILE): Promise<string | null> {
    await loadPickerApi();

    return new Promise((resolve, reject) => {
        const google = (window as any).google;
        if (!google || !google.picker) {
            reject(new Error('Google Picker API not loaded'));
            return;
        }

        let view;

        if (type === PickType.FOLDER) {
            view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true);
        } else {
            // FILE Mode
            // Primary View: The Shared Folder (if likely accessible) or just Docs
            view = new google.picker.DocsView(google.picker.ViewId.DOCS);
            view.setMimeTypes('application/vnd.google-apps.spreadsheet');
        }

        if (folderId) {
            view.setParent(folderId);
        }

        const builder = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.SUPPORT_DRIVES)
            .setAppId(GOOGLE_CLIENT_ID)
            .setOAuthToken(oauthToken)
            .addView(view);

        // Add fallback view for files
        if (type === PickType.FILE) {
            const allView = new google.picker.View(google.picker.ViewId.SPREADSHEETS);
            builder.addView(allView);
        }

        const picker = builder
            .setCallback((data: any) => {
                if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                    const doc = data[google.picker.Response.DOCUMENTS][0];
                    resolve(doc[google.picker.Document.ID]);
                } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
                    resolve(null);
                }
            })
            .build();

        picker.setVisible(true);
    });
}
