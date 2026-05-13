# WSSAR Conference Registration — Project Context

## What This Is
A Google Apps Script web app replacing the old Google Form-based registration for the Washington SAR annual conference. Built for the `washingtonsar.org` Google Workspace.

## Repository
- **GitHub**: https://github.com/dbwiddis/wssar-conference-registration (private)
- **Local clone**: `~/wssar-conference-registration`
- **Source files**: `src/` directory (`.js` and `.html` — NOT `.gs`, Apps Script editor uses `.js`)

## Google Apps Script Project
- **Script ID**: `1s60il3Bss9w6E-dz3Ynv5fHcup_M2lSSLpMiZ1MOQzYbP-VWvI9hGj5p`
- **Deployment ID**: `AKfycbw1YMCC6oUsruVPvPmRLVLBMr5Mbbog9T1EWX9DQpaJVMkmBeEzjhSHzSwOq3esk78D`
- **Live URL**: `https://script.google.com/macros/s/AKfycbw1YMCC6oUsruVPvPmRLVLBMr5Mbbog9T1EWX9DQpaJVMkmBeEzjhSHzSwOq3esk78D/exec`
- **Bound to**: "WSSAR Conference Registration" Google Sheet in washingtonsar.org workspace
- **Logged in as**: registration@washingtonsar.org

## Deploy Workflow
```bash
cd ~/wssar-conference-registration/src
npx clasp push --force
npx clasp deploy -i AKfycbw1YMCC6oUsruVPvPmRLVLBMr5Mbbog9T1EWX9DQpaJVMkmBeEzjhSHzSwOq3esk78D -d "vN - description"
```
The `.clasp.json` is in `src/` (not repo root). Always use `--force` on push.
After deploying, update the version in **Deploy → Manage deployments** in the Apps Script editor.

### clasp login
On this machine, `clasp login --no-localhost` gives a URL to open in browser. After authorizing, the redirect fails (goes to localhost:8888). Extract the `code=` from the URL and exchange it manually:
```bash
curl -s -X POST https://oauth2.googleapis.com/token \
  -d "code=THE_CODE" \
  -d "client_id=1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com" \
  -d "client_secret=v6V3fKV_zWU7iw1DrpO1rknX" \
  -d "redirect_uri=http://localhost:8888" \
  -d "grant_type=authorization_code"
```
Then update `~/.clasprc.json` with the new tokens.

## Source Files
| File | Purpose |
|------|---------|
| `Code.js` | HTTP routing (doGet/doPost), registration CRUD, email sending |
| `Config.js` | Sheet readers (getAllConfig, getMealOptions, getPricing, getFields, etc.) |
| `Stripe.js` | Stripe Checkout Sessions API, webhook handler, fee calculation |
| `RegenerateFormData.js` | **Run `regenerateFormData()` after any sheet changes.** Compiles sheet data into Script Properties for fast page loads. |
| `Admin.js` | Spreadsheet menu "Registration Admin" → sidebar for recording manual payments |
| `Bootstrap.js` | ⚠️ ONE-TIME setup. Creates all sheet tabs with sample data. **Will overwrite existing data.** |
| `Index.html` | The registration form (email-first flow) |
| `Status.html` | Status lookup page (for direct URL access) |
| `Confirm.html` | Post-Stripe-payment "Payment Received" page |

## Key Gotchas Discovered
1. **File extensions**: Apps Script editor shows `.gs` but files are `.js`. Push `.js` files only.
2. **Serialization**: `google.script.run` silently returns `null` for complex objects. Use `JSON.stringify()` on server, `JSON.parse()` on client.
3. **Deployments**: `clasp deploy` without `-i` creates a NEW deployment. Always use `-i <DEPLOYMENT_ID>`.
4. **HTML sanitizer**: Apps Script strips JS comments (`/* */`) from `<script>` blocks. Use real variable assignments as placeholders for content injection.
5. **Template engine**: `createTemplateFromFile` + `evaluate()` is slow and can hang on complex files. Use `createHtmlOutputFromFile` + `getContent()` + string replace instead.
6. **Inlined form data**: Form config is injected directly into HTML at serve time (no `google.script.run` round-trip for initial load). Requires `regenerateFormData()` after sheet changes.
7. **"Unpaid" contains "paid"**: Status checks must exclude "unpaid" when looking for "paid" substring.
8. **clasp auth expires**: Re-auth needed periodically. See login instructions above.

## Architecture & Performance
- **Form data is precompiled**: `regenerateFormData()` reads all config sheets once and stores JSON in Script Properties. `doGet` injects this directly into the HTML — no second server call needed.
- **Cold start**: ~2-4s for Apps Script to spin up (unavoidable). After that, form renders instantly.
- **Email lookup**: `lookupRegistration()` reads the Registrations sheet on each call (~1-2s). Acceptable for ~70 registrations.
- **Stripe calls**: Isolated in try/catch — failures don't block registration submission.

## Google Sheet Tabs
| Tab | Purpose |
|-----|---------|
| Config | Key/value pairs (see Config Keys below) |
| Fields | Form field labels and descriptions (FieldID, Label, Description) |
| Chapters | Dropdown options for chapter selection |
| Affiliations | Checkbox options for compatriot affiliations |
| Meals | Event, Option, Price — row order = display order |
| Pricing | Item, Price, Description — "Donation" items become donation dropdown |
| Registrations | One row per registrant (18 columns incl. MealSelections in col R) |
| Guests | One row per guest, linked by RegistrationID |
| Payments | Payment records (auto from Stripe webhook, manual via Admin sidebar) |

### Config Sheet Keys
`EventName`, `EventDates`, `RegistrationPrefix`, `RegistrationCutoff`, `StripeTestMode`, `PaymentEmail`, `CheckPayableTo`, `MailTo`, `ConferenceContact`, `PaymentContact`, `DonationNote`, `LodgingNote`, `ZelleQR`

### Script Properties (Project Settings → Script Properties)
`STRIPE_TEST_KEY`, `STRIPE_SECRET_KEY`, `FORM_DATA` (auto-generated by regenerateFormData)

## Stripe Setup
- **Account**: New dedicated account (separate from old Donorbox account, same login)
- **Test mode**: `StripeTestMode = TRUE` in Config → uses `STRIPE_TEST_KEY`
- **Live mode**: `StripeTestMode = FALSE` in Config → uses `STRIPE_SECRET_KEY`
- **Webhooks**: Configured for both test and live modes, listening for `checkout.session.completed`
- **Payment status**: Shows card brand + last4 (e.g., "Paid - Visa 4242") via expanded payment intent
- **Itemized receipt**: Registration & Meals, Raffle Tickets, Donation (tax-deductible w/ EIN), CC Processing Fee
- **Tax-deductible**: Donation amount + EIN 91-1167420 shown on Stripe receipt metadata and paid status page

## What's Done
- **Email-first flow**: Enter email → auto-lookup → paid status / pre-filled edit / new registration
- **Precompiled + inlined form data**: Zero round-trips for initial page render
- **Multi-step form**: Email → Contact → Guests → Meals → Extras → Review
- **Pre-fill on re-entry**: All fields restored including affiliations, meals, raffle, donation, guests
- **Stripe Checkout Sessions**: Itemized cart, dynamic amounts, test/live toggle
- **3 payment options**: Mail a Check, Send Zelle (with QR code), Pay with Card
- **Webhook auto-reconciliation**: Stripe payments auto-update status with card details
- **Admin sidebar**: "Registration Admin" menu in spreadsheet for recording Zelle/check payments
- **Tax receipt**: Paid status page shows donation amount + EIN (printable)
- **Confirmation emails**: Plain text + HTML with payment instructions
- **Registration editing**: Same email overwrites; locked once paid
- **Error isolation**: Stripe/email failures don't block registration

## What's Next / Future TODOs
1. **Custom domain**: Set up `conference.washingtonsar.org` → iframe or redirect to Apps Script URL. Coordinate with webmaster.
2. **Running total on meals step** — currently only shows on Extras/Review steps.
3. **Email not pre-filling after Stripe payment** — known limitation of Apps Script iframe sandboxing.
4. **Optional: migrate hosting** — Firebase/Cloudflare/Vercel would eliminate cold start (~$0/month at this scale) but adds deployment complexity.

## Go-Live Checklist
1. In Config sheet, change `StripeTestMode` from `TRUE` to `FALSE`
2. Complete Stripe account activation if not done (business verification, bank account for payouts)
3. Verify webhook is set up in Stripe live mode (already done ✓)
4. Enable receipt emails: Stripe Dashboard → Settings → Emails → Successful payments
5. Update Chapters, Affiliations, Meals, Pricing tabs with actual conference data
6. Run `regenerateFormData()` after updating sheets
7. Set `RegistrationCutoff` date in Config sheet
8. Test end-to-end with a real card (refund immediately after)
9. Set up `conference.washingtonsar.org` redirect/iframe
10. Update deployment version in Manage Deployments
