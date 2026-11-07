# Local QR attendance evidence

Captured from the actual React/Express/Auth/Firestore emulator flow, using only
synthetic demo identities. QR and manual codes are masked in ticket screenshots;
downloaded PNGs, raw logs and browser traces remain outside this evidence folder.

- `ticket-desktop-masked.png`, `ticket-mobile-masked.png`: active ticket layout.
- `check-in-confirmed.png`: successful server-authoritative attendance receipt.
- `attendance-roster.png`: two active registrations and two recorded arrivals.
- `check-results.json`: completed build, API and browser verification.

Camera video decoding was exercised with a generated local media stream containing
real QR pixels. No physical camera, production walkthrough, deployment, lecturer
approval or usability study is claimed. The first upload test failed because its
extensionless temporary file had no PNG MIME type; corrected test metadata, a
targeted rerun and the full suite passed.
