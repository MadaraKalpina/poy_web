# Setting up the order form → Google Sheet + email

The collar builder's order form sends each submission to a small script
running on Google's servers (a "Google Apps Script Web App"), which adds a
row to a Google Sheet and sends the notification emails. This is a one-time
setup — once it's deployed, nothing here needs to be touched again unless you
want to change what's collected or how the emails read.

## 1. Create the Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like "Poy collar orders."
2. In row 1, paste this header row (one cell per column) exactly, in this
   order:

   ```
   Timestamp	Neck (cm)	Breed	Width	Hardware	Fabric	Nametag?	Nametag text	Background	Background (custom)	Embroidery color	Embroidery color (custom)	Font	Font (custom)	Delivery method	Delivery address	Zásilkovna point	Balíkovna point	Name	Email	Phone	Instagram	Notes
   ```

   (Type it into cell A1 then hit Tab between each — or paste the whole line
   in and Sheets will split it into columns automatically.)

## 2. Add the script

1. In the Sheet, go to **Extensions → Apps Script**. A new tab opens with a
   blank `Code.gs` file.
2. Delete whatever's in there, and paste in the entire contents of
   [`Code.gs`](./Code.gs) from this folder.
3. Near the top of the pasted script, check two lines:
   - `var TOKEN = 'poy-collar-order-form';` — this must match the
     `APPS_SCRIPT_TOKEN` value in `script.js` on the website. Leave both as
     the default, or change both to the same new value — just keep them
     identical.
   - `var OWNER_EMAIL = 'atelierpoy@gmail.com';` — where new-order emails go.
     Change this if that address ever changes.
4. Click the **Save** icon (or Ctrl/Cmd+S).

## 3. Deploy it as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set **Execute as** to **Me**, and **Who has access** to **Anyone** (this
   has to be "Anyone" — the order form has no login, so Google needs to
   accept requests from any visitor).
4. Click **Deploy**. The first time, Google will ask you to authorize the
   script — click through **Authorize access**, choose your account, and (if
   it warns "Google hasn't verified this app") click **Advanced → Go to
   [project name] (unsafe)** — this warning is normal for a script you wrote
   yourself and only you can run.
5. Copy the **Web app URL** it gives you (ends in `/exec`).

## 4. Connect the website to it

1. Open `script.js` in the website's code and find this line near the top of
   the collar-order section:
   ```js
   var APPS_SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
2. Replace the placeholder text with the URL you copied in step 3.5, keeping
   the quotes.
3. Save, and publish the site as usual.

## 5. Test it

Fill out and submit the order form once yourself (use a real email address
you can check). Confirm:
- A new row appeared at the bottom of the Sheet with your test data.
- An email arrived at `OWNER_EMAIL`.
- A confirmation email arrived at the email address you entered in the form.

## If you ever need to change something

- **Add or remove a form field**: update `SHEET_COLUMNS` in `Code.gs` to
  match, add/remove the matching column in the Sheet's header row, and update
  `collectOrderPayload()` in `script.js` to match — all three need to agree
  on the same field names. If the field should also show up in the
  customer's confirmation email, add it to `CUSTOMER_LABELS` and
  `buildCustomerOrderSummary()` too (Czech and English).
- **Change the email wording**: edit the text inside `sendOwnerEmail()` /
  `sendCustomerEmail()` in `Code.gs` — the customer email's order summary
  (the "here's what you selected" list) comes from `buildCustomerOrderSummary()`
  and `CUSTOMER_LABELS` just above it — then **Deploy → Manage deployments →
  edit (pencil) → New version → Deploy** so the live script picks up the
  change (saving alone isn't enough — Web Apps only update on a new version).
- **Google emails you saying "Apps Script - Authorization needed" or
  similar** after some months: this is normal and rare; just re-run through
  step 3 for a new version.
