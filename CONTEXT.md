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
- Multi-step registration form (Contact → Guests → Meals → Extras → Review)
- Live running total updates as selections change (fixed: now updates on step navigation)
- Chapter dropdown and affiliations checkboxes populated from sheets
- Configurable field labels/descriptions from Fields sheet
- Auto-calculated registration count (1 + number of guests)
- Special meal requests on the Meals step (not Extras)
- Donation note (tax-deductible/EIN 91-1167420) from Config
- Stripe Checkout Sessions API integration (itemized cart: registration, meals, raffle, donation w/ EIN, CC fee)
- StripeTestMode toggle in Config sheet (uses STRIPE_TEST_KEY or STRIPE_SECRET_KEY from Script Properties)
- Confirmation emails (plain text + HTML) matching the style of the 2026 emails
- Status lookup page by email (fixed: JSON.stringify/parse for google.script.run serialization)
- Stripe webhook handler (`doPost`) for automatic payment reconciliation
- Manual payment recording function for Zelle/check
- Registration editing (same email overwrites existing row)
- Registration cutoff date support
- Pre-fill form from existing registration on email blur (partial — triggers after tabbing out of email field)
- Error isolation: Stripe/email failures don't block registration submission

## What's Next
1. **Stripe webhook setup**: In Stripe Dashboard → Developers → Webhooks, add endpoint pointing to the web app URL, listening for `checkout.session.completed`. This enables automatic payment status updates.
2. **Improve pre-fill UX**: Currently triggers on email blur. Could add a "Look up" button or trigger on Enter key for better discoverability.
3. **Pre-fill form on edit from Status page**: Status page "Edit" link navigates to form but doesn't pass the email to auto-trigger lookup.
4. **Payment instructions on confirmation page**: Show Zelle/check/mail details on the confirmation screen (currently only in the email).
5. **Hotel reservation link**: Config has `LodgingNote` field — update with actual hotel booking link.
6. **Customize sheet data**: Update Chapters, Affiliations, Meals, Pricing tabs with actual 2027 conference data.
7. **End-to-end testing**: Verify webhook with Stripe test mode, test status lookup shows paid after webhook fires.
8. **Admin dashboard**: Optional — summary view of registered/paid/unpaid counts.

## Original System Reference
The 2026 conference used a Google Form with Apps Script. The form questions and email format are documented in the chat history. Key differences from old system:
- Old: single Google Form, all-or-nothing submit, email-only payment instructions
- New: multi-step web app, live totals, status lookup page, Stripe webhook auto-reconciliation, editable registrations
