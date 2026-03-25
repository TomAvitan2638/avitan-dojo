# Development Recovery Guide

## When You See: "Cannot find module './vendor-chunks/@radix-ui.js'" or Broken Screens

These errors are caused by **Next.js dev cache corruption**, not by your code. The `.next` directory holds cached chunks that can become stale or corrupted after route changes, HMR updates, or package changes.

---

## Quick Recovery (Run These in Order)

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Delete the cache
rm -rf .next

# 3. Restart dev
npm run dev
```

**Or use the shortcut:**
```bash
npm run dev:clean
```
(This deletes `.next` and starts dev in one command.)

---

## If That Doesn't Work: Full Clean

```bash
# Stop dev server first

rm -rf .next node_modules
npm install
npm run dev
```

---

## Windows Users

Use one of these instead of `rm -rf`:
```cmd
rmdir /s /q .next
```
Or in PowerShell:
```powershell
Remove-Item -Recurse -Force .next
```

---

## What Causes These Errors

1. **Vendor chunk invalidation** – Next.js bundles `@radix-ui/*` into vendor chunks. During HMR or route changes, chunk references can become stale.
2. **Radix UI + Next.js** – Radix packages are commonly affected by dev cache issues.
3. **No Turbopack** – We use standard webpack. Turbopack has additional known issues with Radix.

## What We've Done to Reduce Occurrence

- **optimizePackageImports** in `next.config.mjs` – Improves how Next.js bundles Radix packages.
- **"use client"** on all Radix-wrapping UI components – Ensures correct client/server boundaries.
- **Single `components/ui` structure** – No duplicate UI component trees.

## Prevention Tips

- Restart dev after changing `package.json` or `next.config`
- If screens break after a route change, run `npm run dev:clean` before debugging
- Avoid editing multiple Radix-using components in quick succession during dev
