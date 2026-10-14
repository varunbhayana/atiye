# Troubleshooting

| Problem | Fix |
|---|---|
| "Maths Adventure can't be opened because it is from an unidentified developer" | Right-click the app → **Open** → **Open**. This is needed once. The app is ad-hoc signed, not notarised by Apple. |
| Nothing happens on double-click | Check `~/Library/Logs/MathsAdventure/launcher.log`. Open Google Chrome once on its own (first-run setup), then try again. |
| "Google Chrome is not installed" dialog | Install Chrome from google.com/chrome, or choose **Open in Safari**. Note that Safari keeps its own separate progress. |
| The window says "Maths Adventure is already open" | The app was launched twice. Click **Play in this window**; the other window pauses. Progress is shared and safe. |
| No voice | Grown-ups → Settings → Spoken instructions. If no voice is listed, add one in macOS: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices (for example *Samantha*, or *Tara* for Hinglish). Everything also works silently with on-screen text. |
| Voice too fast | Grown-ups → Settings → Voice speed → Slow or Very slow. |
| No Hindi voice | Ollie needs the macOS Hindi voice **Lekha**. Add it in System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → Hindi. Until then Ollie uses an Indian-English voice. |
| Too much movement | Grown-ups → Settings → Reduce motion → On. In Catch the Number, the child can also press **Stop moving**. |
| "Saved data was damaged…" notice | The app restored the previous good copy automatically. Download a backup in Grown-ups → Data. |
| Moving the app to another Mac | On the old Mac: Grown-ups → Data → **Download backup**. Install the app on the new Mac, then use **Restore from backup…**. |
| Start completely fresh | Grown-ups → Data → Reset progress. Or delete `~/Library/Application Support/MathsAdventure/` while the app is closed. |
| Uninstall | Delete the app and `~/Library/Application Support/MathsAdventure/`. |

## Rebuilding (for developers)

```bash
npm install
npm run verify        # typecheck, lint, unit tests, build, Playwright E2E (needs Google Chrome)
npm run package:mac   # → release/
```
