# PersonalWebsite

Personal website and ToolBox collection for [mihaplemenitas.com](https://mihaplemenitas.com).

## Local development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

The first ToolBox tool is available at `/toolbox/qr-code-generator` and generates QR codes locally in the browser.

Stamp is available at `/stamp`. It requires a Google OAuth web client ID, the Google Drive API, and the Google Sheets API:

1. Create a Web application OAuth client in Google Cloud and enable the Google Drive API and Google Sheets API.
2. In **Google Auth Platform → Data access**, add `https://www.googleapis.com/auth/drive.metadata.readonly` and `https://www.googleapis.com/auth/spreadsheets`. In **Audience**, add your account as a test user while the app is in Testing.
3. Add your local origin (`http://localhost:3000`) and deployed site origin to the OAuth client's authorized JavaScript origins.
4. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the OAuth client ID.

Stamp requests Google account identity, read-only Drive metadata access to find `Triglav_Delovne_Ure`, and Google Sheets access to read and update that timecard. It records arrivals in column C, departures in column D, decimal daily hours in column E, and the month-end total in column F on the final day of the month. At month-end, it colors that row cherry red with white text. Google's Sheets scope is account-wide; Stamp's code only writes to the matching timecard file.
