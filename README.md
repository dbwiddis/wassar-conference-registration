# WASSAR Conference Registration

Google Apps Script web app for the Washington State Society SAR annual conference registration.

## Features

- Email-first flow: enter email → auto-detects new/returning/paid registrants
- Multi-step registration form (Contact → Guests → Meals → Extras → Review)
- Pre-fills all fields for returning registrants
- Stripe Checkout Sessions with itemized receipt (Registration & Meals, Raffle, Donation w/ EIN, CC Fee)
- Three payment options: Mail a Check, Send Zelle (with QR), Pay with Card
- Webhook auto-reconciliation with card details (e.g., "Paid - Visa 4242")
- Admin sidebar in spreadsheet for recording manual Zelle/check payments
- Tax-deductible donation tracking with EIN on receipt
- Precompiled form data for fast page loads
- Registration cutoff date support
- Confirmation emails with payment instructions

## Project Structure

```
src/
  Code.js                — HTTP routing, registration CRUD, email sending
  Config.js              — Sheet readers (config, meals, pricing, fields, chapters, affiliations)
  Stripe.js              — Stripe Checkout Sessions API, webhook handler, fee calculation
  RegenerateFormData.js  — Run regenerateFormData() after sheet changes
  Admin.js               — Spreadsheet menu for recording manual payments
  Bootstrap.js           — ⚠️ ONE-TIME setup (creates sheets with sample data)
  Index.html             — Registration form (email-first flow)
  Status.html            — Status lookup page (direct URL access)
  Confirm.html           — Post-payment confirmation page
docs/
  index.html             — GitHub Pages iframe wrapper for custom domain
  CNAME                  — Custom domain config
```

## Workflow

1. Edit sheet data (Config, Meals, Pricing, Fields, Chapters, Affiliations)
2. Run `regenerateFormData()` in Apps Script editor to recompile
3. Push and deploy:
   ```bash
   cd src && npx clasp push --force
   npx clasp deploy -i <DEPLOYMENT_ID> -d "description"
   ```
4. Update deployment version in Deploy → Manage deployments

## Google Sheet Tabs

| Tab | Purpose |
|-----|---------|
| Config | Key/value pairs (event name, dates, contacts, Stripe toggle, etc.) |
| Fields | Form field labels and descriptions |
| Chapters | Dropdown options for chapter selection |
| Affiliations | Checkbox options for compatriot affiliations |
| Meals | Event, Option, Price — row order = display order |
| Pricing | Item, Price, Description — "Donation" items become donation dropdown |
| Registrations | One row per registrant (18 columns incl. MealSelections) |
| Guests | One row per guest, linked by RegistrationID |
| Payments | Payment records (auto from Stripe, manual via Admin sidebar) |

## Year-to-Year Updates

Most changes only require editing the Google Sheet tabs:
- **Meals tab**: Update meal names, events, and prices
- **Pricing tab**: Update registration fee, raffle price, donation tiers
- **Config tab**: Update event name, dates, cutoff date, contacts
- Then run `regenerateFormData()` to recompile

See [CONTEXT.md](CONTEXT.md) for full documentation including Go-Live Checklist and Stripe setup.
