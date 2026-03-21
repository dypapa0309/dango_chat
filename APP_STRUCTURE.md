# DANGO App Structure

## Purpose

This project is organized so the same frontend can be used for:

- static web deployment
- Netlify deployment with serverless functions
- future app packaging with a WebView wrapper such as Capacitor

## Folders

- `app/`
  Static frontend root for deployment
- `app/index.html`
  Main landing page
- `app/estimate/`
  Detailed estimate flow
- `app/admin/`
  Admin tool
- `app/customer/`
  Customer payment flow
- `app/driver/`
  Driver response flow
- `netlify/functions/`
  Serverless APIs
- `shared/`
  Shared server-side helpers

## Test paths

When running `netlify dev`, verify these screens:

- `/`
- `/estimate/`
- `/customer/pay.html`
- `/customer/success.html`
- `/driver/accept.html`
- `/admin/`

## Notes for app packaging

- `capacitor.config.json` points `webDir` to `app`
- app packaging should load the built static frontend from `app/`
- payment, phone links, maps, and external SDK behavior must be rechecked inside iOS and Android WebViews
