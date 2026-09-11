# AutoFillX

A Chrome extension that fills out any application or web form (job applications,
account sign-ups, government forms, etc.) from a single profile that never
leaves your computer.

## How it's kept secure

- **Local-only storage.** Your profile is saved with `chrome.storage.local`,
  which lives on your device only. AutoFillX makes no network requests at
  all — check `manifest.json`, there is no `host_permissions` entry and no
  server code anywhere in this project.
- **Encrypted at rest.** The profile is encrypted with AES-256-GCM before
  it's written to disk. The key is derived from your master password with
  PBKDF2 (250,000 iterations, SHA-256), so even someone with access to your
  Chrome profile folder can't read your data without the password.
- **Password never stored.** Your master password only ever exists in page
  memory for the moment it's needed to derive the key. It is not saved
  anywhere, which also means AutoFillX cannot recover it if you forget it.
- **Session-only unlock.** While unlocked, the _decrypted_ profile is kept in
  `chrome.storage.session`, which Chrome guarantees is wiped when the browser
  closes. It also auto-locks after an idle timeout you control (default 15
  minutes) from the options page.
- **No third-party code.** No analytics, no remote scripts, no CDNs bundled
  into the extension logic itself (Google Fonts is loaded for the settings
  UI only, over HTTPS, and never sees your data).

## Installing it (unpacked, for your own use)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Click the AutoFillX icon in your toolbar and choose **Set up your vault**
   to create a master password and fill in your profile.

## Using it

- Click into any recognized field on any page — a small icon appears
  next to it. Click the icon (or focus the field and press `Alt+Shift+F`) to
  fill it from your vault.
- Open the popup and click **Fill all fields on this page** to fill
  everything AutoFillX recognizes at once.
- AutoFillX covers personal info, address, professional details, education,
  work authorization, emergency contacts, and optional sensitive IDs
  (SSN, driver's license, passport) — edit the full list from **Edit
  profile** in the popup.

## Multiple profiles

Add as many profiles as you like (e.g. "Personal", "Work", "My spouse") from
the options page — click **+ Add** in the sidebar. All profiles share the
same master password and are stored in the same encrypted vault; only their
field values differ.

- The popup shows a **Filling from** dropdown when unlocked — pick which
  profile autofill uses on this device right now.
- In the options page, each profile has its own **Use for autofill** button
  to set it as the active one, plus **Rename** and **Delete profile**.
- Switching profiles doesn't erase anything — your edits are captured
  automatically when you switch, but click **Save changes** to write them to
  the encrypted vault on disk.

## Troubleshooting autofill

If the icon doesn't ever appear next to fields:

1. Reload the extension from `chrome://extensions` after any update, then
   refresh the page you're testing on (content scripts only update on page
   reload).
2. Open DevTools on the page (`F12` → Console) and look for a line reading
   `[AutoFillX] content script active on this page.` If it's missing, the
   script isn't injecting — check `chrome://extensions` for errors, and note
   that Chrome blocks content scripts on its own internal pages
   (`chrome://…`) and the Chrome Web Store by design.
3. Make sure the vault is actually unlocked (open the popup — it should say
   "Unlocked · autofill is active", not "locked").
4. Field detection is heuristic and won't catch every custom-built form
   component (e.g. some React comboboxes) — for those you'll still need to
   type manually.

## Notes

- Every field is optional. Leave sensitive fields (SSN, passport, license
  number) blank unless you specifically want them available for autofill.
- Field detection is heuristic (it reads labels, names, IDs, and
  placeholders), so always glance over a form before submitting it.
- If you forget your master password, there is no recovery path by design —
  you'll need to delete the vault from the options page and start over.
