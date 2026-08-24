// Poy — collar order form backend.
// Deployed as a Google Apps Script Web App bound to the order Google Sheet.
// Receives the order form's POST, appends a row to the Sheet, and sends the
// owner + customer notification emails. See README.md in this folder for
// how to set this up — it's a one-time copy/paste/deploy, no maintenance
// after that.

// Must match APPS_SCRIPT_TOKEN in script.js — a lightweight check so a
// stranger who finds the public Web App URL can't spam rows/emails.
var TOKEN = 'poy-collar-order-form';

// Where new-order notifications are sent.
var OWNER_EMAIL = 'atelierpoy@gmail.com';

// One entry per order field, in the order they'll appear as Sheet columns
// (after the automatic Timestamp column). Must match the keys collectOrderPayload()
// sends from script.js.
var SHEET_COLUMNS = [
  'neckCircumference', 'breed', 'width', 'hardware', 'fabric',
  'nametagChoice', 'nametagText', 'nametagBackground', 'nametagBackgroundText',
  'embroideryColor', 'embroideryColorText', 'nametagFont', 'nametagFontText',
  'delivery', 'deliveryAddress', 'deliveryZasilkovnaPoint', 'deliveryBalikovnaPoint',
  'contactName', 'contactEmail', 'contactPhone', 'contactInstagram', 'notes'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.token !== TOKEN) {
      return jsonResponse({ ok: false, error: 'invalid token' });
    }

    appendOrderRow(data);
    sendOwnerEmail(data);
    sendCustomerEmail(data);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function appendOrderRow(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = [new Date()];
  SHEET_COLUMNS.forEach(function (key) {
    row.push(data[key] || '');
  });
  sheet.appendRow(row);
}

function sendOwnerEmail(data) {
  var subject = 'New collar order from ' + (data.contactName || 'a customer');
  var body = SHEET_COLUMNS.map(function (key) {
    return key + ': ' + (data[key] || '—');
  }).join('\n');
  MailApp.sendEmail(OWNER_EMAIL, subject, body);
}

// Friendly labels/values for the customer-facing summary — the Sheet (and
// the owner email above) can stay as raw field keys/codes since the owner
// already knows what they mean, but the customer needs to recognize their
// own choices at a glance.
var CUSTOMER_LABELS = {
  cz: {
    fields: {
      neckCircumference: 'Obvod krku', breed: 'Plemeno', width: 'Šířka',
      hardware: 'Kování', fabric: 'Látka', nametagChoice: 'Jmenovka',
      nametagText: 'Text k vyšití', nametagBackground: 'Barva podkladu',
      embroideryColor: 'Barva výšivky', nametagFont: 'Styl výšivky',
      delivery: 'Doprava', deliveryAddress: 'Doručovací adresa',
      deliveryZasilkovnaPoint: 'Adresa zásilkovny', deliveryBalikovnaPoint: 'Adresa balíkovny',
      contactName: 'Jméno', contactPhone: 'Telefon', contactInstagram: 'Instagram',
      notes: 'Poznámky'
    },
    values: {
      width: { '25': '25 mm', '40': '40 mm' },
      nametagChoice: { without: 'Bez jmenovky', with: 'S jmenovkou' },
      nametagBackground: { white: 'Bílá', custom: 'Vlastní' },
      embroideryColor: { black: 'Černá', matching: 'Podle zvoleného vzoru', custom: 'Vlastní' },
      nametagFont: { handwritten: 'Ručně psané / kurzíva', custom: 'Vlastní' },
      delivery: {
        pickup: 'Osobní odběr, Praha 6', zasilkovna: 'Zásilkovna',
        balikovna_home: 'Balíkovna — domů na adresu', balikovna_box: 'Balíkovna — do Balíkovny'
      }
    }
  },
  en: {
    fields: {
      neckCircumference: 'Neck circumference', breed: 'Breed', width: 'Width',
      hardware: 'Hardware', fabric: 'Fabric', nametagChoice: 'Nametag',
      nametagText: 'Embroidered text', nametagBackground: 'Background color',
      embroideryColor: 'Embroidery color', nametagFont: 'Embroidery style',
      delivery: 'Delivery', deliveryAddress: 'Delivery address',
      deliveryZasilkovnaPoint: 'Zásilkovna pick-up point', deliveryBalikovnaPoint: 'Balíkovna pick-up point',
      contactName: 'Name', contactPhone: 'Phone', contactInstagram: 'Instagram',
      notes: 'Notes'
    },
    values: {
      width: { '25': '25 mm', '40': '40 mm' },
      nametagChoice: { without: 'Without a nametag', with: 'With a nametag' },
      nametagBackground: { white: 'White', custom: 'Custom' },
      embroideryColor: { black: 'Black', matching: 'Matching the chosen pattern', custom: 'Custom' },
      nametagFont: { handwritten: 'Handwritten / cursive', custom: 'Custom' },
      delivery: {
        pickup: 'In-person pickup, Prague 6', zasilkovna: 'Zásilkovna',
        balikovna_home: 'Balíkovna — home delivery', balikovna_box: 'Balíkovna — pick-up point'
      }
    }
  }
};

// Builds the "here's what you ordered" lines for the customer email — skips
// blank fields and any sub-field that doesn't apply to what they picked
// (e.g. no nametag sub-fields shown at all if they didn't add a nametag).
function buildCustomerOrderSummary(data, isEnglish) {
  var labels = CUSTOMER_LABELS[isEnglish ? 'en' : 'cz'];
  var lines = [];

  var addLine = function (key) {
    var raw = data[key];
    if (!raw) return;
    var value = (labels.values[key] && labels.values[key][raw]) || raw;
    lines.push(labels.fields[key] + ': ' + value);
  };

  addLine('neckCircumference');
  addLine('breed');
  addLine('width');
  addLine('hardware');
  addLine('fabric');
  addLine('nametagChoice');

  if (data.nametagChoice === 'with') {
    addLine('nametagText');
    addLine('nametagBackground');
    if (data.nametagBackground === 'custom') addLine('nametagBackgroundText');
    addLine('embroideryColor');
    if (data.embroideryColor === 'custom') addLine('embroideryColorText');
    addLine('nametagFont');
    if (data.nametagFont === 'custom') addLine('nametagFontText');
  }

  addLine('delivery');
  if (data.delivery === 'balikovna_home') addLine('deliveryAddress');
  if (data.delivery === 'zasilkovna') addLine('deliveryZasilkovnaPoint');
  if (data.delivery === 'balikovna_box') addLine('deliveryBalikovnaPoint');

  addLine('contactName');
  addLine('contactPhone');
  addLine('contactInstagram');
  addLine('notes');

  return lines.join('\n');
}

function sendCustomerEmail(data) {
  if (!data.contactEmail) return;

  var isEnglish = data.lang === 'en';
  var subject = isEnglish ? 'Your Poy collar order' : 'Vaše objednávka obojku Poy';
  var greeting = data.contactName ? (isEnglish ? 'Hi ' + data.contactName : 'Ahoj ' + data.contactName) : (isEnglish ? 'Hi' : 'Ahoj');
  var intro = isEnglish
    ? greeting + ',\n\nThanks for your order! We\'ll be in touch soon to confirm details and arrange payment and delivery.\n\nHere\'s what you selected:\n'
    : greeting + ',\n\nDěkujeme za objednávku! Brzy se vám ozveme s potvrzením a domluvíme platbu a dodání.\n\nShrnutí vaší objednávky:\n';
  var body = intro + buildCustomerOrderSummary(data, isEnglish) + '\n\n— Poy';
  MailApp.sendEmail(data.contactEmail, subject, body);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
