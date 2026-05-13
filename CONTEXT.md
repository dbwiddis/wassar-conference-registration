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
# Load nvm (required each shell session on this Amazon Linux 2 machine)
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 16

# Push code and deploy
cd ~/wssar-conference-registration/src
clasp push --force
clasp deploy -i AKfycbw1YMCC6oUsruVPvPmRLVLBMr5Mbbog9T1EWX9DQpaJVMkmBeEzjhSHzSwOq3esk78D -d "vN - description"
```
The `.clasp.json` is in `src/` (not repo root). Always use `--force` on push.

## Key Gotchas Discovered
1. **File extensions**: Apps Script editor creates `.js` files, not `.gs`. If you push `.gs` files, they're treated as NEW files and the old `.js` ones remain — your changes silently don't take effect.
2. **Serialization**: `google.script.run` can silently return `null` for complex objects. All server→client returns use `JSON.stringify()` on the server and `JSON.parse()` on the client.
3. **Deployments**: `clasp deploy` without `-i` creates a NEW deployment with a new URL. Always use `-i <DEPLOYMENT_ID>` to update the existing one.
4. **Setup function**: `SpreadsheetApp.getUi().alert()` hangs when run from the editor — replaced with `Logger.log()`.
5. **clasp login**: On this machine, `clasp login --no-localhost` works but the redirect goes to Jupyter on port 8888. After authorizing in browser, grab the `code=` parameter from the failed redirect URL and paste it into the terminal.

## Google Sheet Tabs
| Tab | Purpose |
|-----|---------|
| Config | Key/value pairs: event name, dates, cutoff, Stripe link, contacts, DonationNote, LodgingNote |
| Fields | Customizable form field labels and descriptions (FieldID, Label, Description) |
| Chapters | Dropdown options for chapter selection |
| Affiliations | Checkbox options for compatriot affiliations |
| Meals | Event, Option, Price — one row per meal choice |
| Pricing | Item, Price, Description — registration fee, raffle, donation tiers |
| Registrations | One row per registrant with payment status |
| Guests | One row per guest, linked by RegistrationID |
| Payments | Payment records (auto from Stripe webhook, manual for Zelle/check) |

## What's Done
- **Email-first flow**: Enter email → auto-lookup → branches to paid status / pre-filled edit / new registration
- Paid registrations show inline status with "contact organizer for changes" message
- Unpaid registrations pre-fill all fields (name, chapter, affiliations, meals, raffle, donation, guests)
- New registrations show "Starting a new one!" banner
- **Precompiled form data**: `regenerateFormData()` stores sheet data in Script Properties for fast page loads
- Multi-step form: Email → Contact → Guests → Meals → Extras → Review
- Live running total on Extras and Review steps
- Chapter dropdown and affiliations checkboxes from sheets
- Configurable field labels/descriptions from Fields sheet
- Donation options from Pricing sheet (auto-appends price to description)
- Raffle price hint ("$25 each") from Pricing sheet
- Stripe Checkout Sessions API with itemized cart (Registration & Meals, Raffle, Donation w/ EIN, CC Fee)
- StripeTestMode toggle in Config sheet
- Confirmation page with 3 payment buttons: Mail a Check, Send Zelle (with QR), Pay with Card
- Post-Stripe green "Payment Received" page → redirects to main form
- Confirmation emails (plain text + HTML) with payment instructions
- Stripe webhook handler (`doPost`) for automatic payment reconciliation
- Meal selections stored as JSON in MealSelections column for pre-fill
- Registration editing (same email overwrites existing row)
- Registration cutoff date support
- Error isolation: Stripe/email failures don't block registration
- Anonymous access (ANYONE_ANONYMOUS) for Stripe webhook POST
- Status page still exists for direct URL access

## What's Next / TODOs
1. **Update email page wording** — "your email is your registration ID" is confusing since we also assign a numeric Registration ID. Reword to clarify email is for lookup/login, Registration ID is for payment reference. Add note about checking spam folders for emails from registration@washingtonsar.org.
2. **Friendlier payment status** — "Paid - Stripe" is meaningless to registrants. Show payment details like "Visa 4242" (available from Stripe webhook `payment_method_details`). For manual payments, allow "Check 1234" or "Zelle 5/13" style entries.
3. **Admin workflow for manual payments** — need an easy way to record Zelle/check payments (currently `recordManualPayment` exists but no UI). Could be a sidebar in the spreadsheet or a simple admin page.
4. **New Stripe account** — set up fresh account separate from Donorbox when ready (see Go-Live Checklist below).
5. **Meal pre-fill testing** — MealSelections header is in sheet; needs a fresh registration with meals to verify restore works on re-entry.
6. **Running total on meals step** — was in early design, currently only shows on Extras/Review steps.

## Go-Live Checklist
When ready to switch from test to production:
1. Create a new Stripe account (or use existing) and complete activation/verification
2. In Script Properties, add `STRIPE_SECRET_KEY` with the live `sk_live_...` key
3. In Config sheet, change `StripeTestMode` from `TRUE` to `FALSE`
4. In Stripe Dashboard (live mode), create a webhook endpoint:
   - URL: `https://script.google.com/macros/s/AKfycbw1YMCC6oUsruVPvPmRLVLBMr5Mbbog9T1EWX9DQpaJVMkmBeEzjhSHzSwOq3esk78D/exec`
   - Event: `checkout.session.completed`
5. Enable receipt emails: Stripe Dashboard → Settings → Emails → Successful payments
6. Update Chapters, Affiliations, Meals, Pricing tabs with actual conference data
7. Set RegistrationCutoff date in Config sheet
8. Test end-to-end with a real card (can refund immediately after)

## Google Sheet Setup Notes
- **Registrations sheet** needs `MealSelections` header in column R (18th column) for meal pre-fill to work
- **Pricing sheet** items starting with "Donation" appear as donation options (case-insensitive match)
- **Meals sheet** row order determines display order (put Saturday Lunch before Saturday Banquet)
- **Config sheet** keys: StripeTestMode, ZelleQR (Google Drive file ID URL), DonationNote, PaymentEmail, CheckPayableTo, MailTo, ConferenceContact, PaymentContact, EventName, EventDates, LodgingNote, RegistrationCutoff, RegistrationPrefix
- **Script Properties** (separate from sheet, only visible to script editors): STRIPE_TEST_KEY, STRIPE_SECRET_KEY

## Original System Reference
The 2026 conference used a Google Form with Apps Script. The form questions and email format are documented in the chat history. Key differences from old system:
- Old: single Google Form, all-or-nothing submit, email-only payment instructions
- New: multi-step web app, live totals, status lookup page, Stripe webhook auto-reconciliation, editable registrations
