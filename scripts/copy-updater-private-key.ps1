# Copy this file's contents into GitHub → Settings → Secrets → TAURI_SIGNING_PRIVATE_KEY
# Run after: npm run generate:updater-keys
Get-Content "apps\desktop\src-tauri\keys\memora.key" | Set-Clipboard
Write-Host "Private key copied to clipboard. Paste into GitHub secret TAURI_SIGNING_PRIVATE_KEY."
