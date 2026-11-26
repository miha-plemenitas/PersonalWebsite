# STAMP-001 — Estimate monthly earnings from a connected timecard

- **Route:** `/stamp`
- **Automation:** `website.testing.StampEarningsTest`
- **Preconditions:** Build or start the loopback site with `NEXT_PUBLIC_GOOGLE_CLIENT_ID=stamp-test-only.apps.googleusercontent.com`. Use a fresh browser context with the time fixed at 14 February 2025, 00:30 in Europe/Ljubljana. OAuth, profile, Drive lookup and Sheets responses are fictional; no Google account or external network is used.
- **Data:** The fictional February timecard contains eight 8-hour shifts, one 5-hour shift and a completed 30-minute shift on 14 February. A January shift and a future February shift must not contribute.

| Step | Expected result |
| --- | --- |
| Open Stamp and choose **Continue with Google**. | The synthetic account connects and opens the dashboard with the February timecard. |
| Read **Earnings this month**. | The estimate shows 69h 30m at 7,73 €/hour and a total of 537,24 €. |
| Open **Settings**, enter 10,00 in **Hourly rate**, press Enter, then return to **Overview**. | The same 69h 30m at 10,00 €/hour now shows 695,00 €. |
| Reload the page in the same session. | The dashboard reconnects with the fictional timecard and still shows 695,00 € at 10,00 €/hour. |
