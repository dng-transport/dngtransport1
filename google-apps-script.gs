/**
 * DNG Transport Booking System - Google Apps Script (Styled & Functional)
 * - Matches frontend headers
 * - Styled sheet layout with conditional formatting
 * - Archives old data and safely rebuilds the sheet
 */

// ======================= Configuration =======================
const SHEET_ID = '1O1u6KlDmsgFJzzaeCYFmDNS2ThQVY2M5ysluRIA33us';
const SHEET_NAME = 'Bookings';

const HEADERS = [
  'Date & Time',
  'Booking ID',
  'Full Name',
  'Phone Number',
  'Pickup Point',
  'Destination',
  'Travel Date',
  'Bus Type',
  'Price', 
  "Payer's Name",
  'Emergency Contact',
  'Emergency Phone',
  'Payment Status'
];

const BRAND_COLORS = {
  primary: '#2563eb',
  light: '#f1f5f9',
  white: '#ffffff',
  border: '#e2e8f0',
  text: '#334155',
  success: '#10b981',
  warning: '#f59e0b'
};

// ======================= Sheet Setup =======================
function createOrUpdateBookingSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  sheet.clear();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();
  sheet.getDataRange().clearDataValidations();

  // Title row
  sheet.getRange(1, 1, 1, HEADERS.length)
    .merge()
    .setValue('🚌  DNG TRANSPORT — BOOKING DASHBOARD')
    .setFontSize(14)
    .setFontWeight('bold')
    .setFontColor(BRAND_COLORS.white)
    .setBackground(BRAND_COLORS.primary)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(false, false, true, false, false, false, BRAND_COLORS.border, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Header row
  sheet.getRange(2, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(2, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setFontSize(10)
    .setFontColor(BRAND_COLORS.text)
    .setBackground(BRAND_COLORS.light)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, BRAND_COLORS.border, SpreadsheetApp.BorderStyle.SOLID);

  sheet.setFrozenRows(2);

  // Column widths
  const widths = HEADERS.map(h => {
    if (/Date/.test(h)) return 140;
    if (/Booking ID/i.test(h)) return 120;
    if (/Name/i.test(h)) return 160;
    if (/Phone/i.test(h)) return 130;
    if (/Pickup|Destination/i.test(h)) return 150;
    if (/Bus Type/i.test(h)) return 110;
    if (/Price/i.test(h)) return 110;
    if (/Status/i.test(h)) return 130;
    return 120;
  });
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  // Row banding
  const bandingRange = sheet.getRange(3, 1, 1000, HEADERS.length);
  bandingRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY)
    .setHeaderRowColor(null)
    .setFirstRowColor(BRAND_COLORS.white)
    .setSecondRowColor('#f9fafb');

  setupColumnFormattingDynamic(sheet);
  addDropdownValidationDynamic(sheet);
  addStatusHighlighting(sheet);

  Logger.log('✅ Booking sheet (re)created with enhanced styling');
  return sheet;
}

function setupColumnFormattingDynamic(sheet) {
  const tsIdx = findHeaderIndex(/Date\s*&\s*Time/i);
  if (tsIdx) sheet.getRange(3, tsIdx, 1000, 1).setNumberFormat('dd/mm/yyyy hh:mm');

  const travelIdx = findHeaderIndex(/Travel Date/i);
  if (travelIdx) sheet.getRange(3, travelIdx, 1000, 1).setNumberFormat('dd/mm/yyyy');

  const priceIdx = findHeaderIndex(/Price/i);
  if (priceIdx) sheet.getRange(3, priceIdx, 1000, 1).setNumberFormat('₵#,##0.00');

  const alignCenter = [tsIdx, travelIdx, priceIdx, findHeaderIndex(/Booking ID/i), findHeaderIndex(/Bus Type/i)];
  alignCenter.forEach(idx => {
    if (idx) sheet.getRange(3, idx, 1000, 1).setHorizontalAlignment('center');
  });

  const alignLeft = [/Full Name/i, /Destination/i, /Pickup/i];
  alignLeft.forEach(rx => {
    const idx = findHeaderIndex(rx);
    if (idx) sheet.getRange(3, idx, 1000, 1).setHorizontalAlignment('left');
  });
}

function addDropdownValidationDynamic(sheet) {
  const busIdx = findHeaderIndex(/Bus Type/i);
  if (busIdx) {
    const busRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Sprinter', 'VIP'], true)
      .setAllowInvalid(false)
      .setHelpText('Select bus type')
      .build();
    sheet.getRange(3, busIdx, 1000, 1).setDataValidation(busRule);
  }

  const payIdx = findHeaderIndex(/Payment Status/i);
  if (payIdx) {
    const payRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Paid', 'UnPaid', 'Partial', 'Refunded'], true)
      .setAllowInvalid(false)
      .setHelpText('Select payment status')
      .build();
    sheet.getRange(3, payIdx, 1000, 1).setDataValidation(payRule);
  }
}

function addStatusHighlighting(sheet) {
  const rules = sheet.getConditionalFormatRules();
  const payIdx = findHeaderIndex(/Payment Status/i);

  if (payIdx) {
    const paidRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Paid')
      .setBackground(BRAND_COLORS.success)
      .setFontColor(BRAND_COLORS.white)
      .setRanges([sheet.getRange(3, payIdx, 1000, 1)])
      .build();

    const unpaidRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('UnPaid')
      .setBackground('#fee2e2')
      .setFontColor('#b91c1c')
      .setRanges([sheet.getRange(3, payIdx, 1000, 1)])
      .build();

    const partialRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Partial')
      .setBackground('#fef3c7')
      .setFontColor('#92400e')
      .setRanges([sheet.getRange(3, payIdx, 1000, 1)])
      .build();

    rules.push(paidRule, unpaidRule, partialRule);
    sheet.setConditionalFormatRules(rules);
  }
}

function findHeaderIndex(regexOrString) {
  const headers = HEADERS;
  if (typeof regexOrString === 'string') {
    const idx = headers.findIndex(h => h === regexOrString);
    return idx === -1 ? 0 : idx + 1;
  } else {
    const idx = headers.findIndex(h => regexOrString.test(h));
    return idx === -1 ? 0 : idx + 1;
  }
}

function findColumnIndexByHeader(sheet, header) {
  const headers = sheet.getRange(2, 1, 1, HEADERS.length).getValues()[0];
  const idx = headers.indexOf(header);
  return idx === -1 ? 0 : idx + 1;
}

// ======================= Booking Save =======================
function saveBookingToSheet(booking) {
  try {
    let sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) sheet = createOrUpdateBookingSheet();

    const rowData = HEADERS.map(h => mapHeaderToValue(h, booking));
    sheet.appendRow(rowData);

    const lastRow = sheet.getLastRow();
    const newRowRange = sheet.getRange(lastRow, 1, 1, rowData.length);
    newRowRange.setFontFamily('Arial').setFontSize(9).setVerticalAlignment('middle');

    const busIdx = findHeaderIndex(/Bus Type/i);
    if (busIdx && (String(mapHeaderToValue('Bus Type', booking)).toUpperCase() === 'VIP' || booking.busType === 'vip')) {
      sheet.getRange(lastRow, busIdx).setBackground('#fef3c7').setFontWeight('bold');
    }

    // continuing from sheet.autoResizeColumns
        sheet.autoResizeColumns(1, rowData.length);

    Logger.log('✅ Booking saved successfully: ' + (booking.bookingReference || 'no-ref'));
    return {
      success: true,
      row: lastRow,
      data: booking,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sheet.getSheetId()}`
    };
  } catch (error) {
    Logger.log('❌ Error saving booking: ' + error.message);
    return { success: false, message: error.message };
  }
}

function mapHeaderToValue(header, booking) {
  switch (header) {
    case 'Date & Time':
      return new Date(booking.timestamp || new Date());
    case 'Booking ID':
      return booking.bookingReference || generateBookingReference();
    case 'Full Name':
      return booking.fullName || '';
    case 'Phone Number':
      return booking.phoneNumber || booking.phone || '';
    case 'Pickup Point':
      return booking.pickupPoint || booking.pickup || '';
    case 'Destination':
      return booking.destination || '';
    case 'Travel Date':
      return booking.travelDate ? new Date(booking.travelDate) : '';
    case 'Bus Type':
      return booking.busType && booking.busType.toLowerCase() === 'vip' ? 'VIP' : 'Sprinter';
    case 'Price':
      return booking.price ? parseFloat(booking.price) : 0;
    case 'Special Requests':
      return booking.specialRequests || '';
    case "Payer's Name":
      return booking.payerName || booking.payer || '';
    case 'Emergency Contact':
      return booking.emergencyName || booking.emergencyContact || '';
    case 'Emergency Phone':
      return booking.emergencyPhone || '';
    case 'Payment Status':
      return booking.paymentStatus || 'UnPaid';
    default:
      return booking[camelKey(header)] || '';
  }
}

function camelKey(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c) => (c ? c.toUpperCase() : ''));
}

// ======================= Web Endpoints =======================
function doPost(e) {
  // 1. Validate request exists
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Invalid request format",
        message: "Missing POST data. Please submit a valid booking request."
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }

  try {
    // 2. Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // 3. Generate booking reference if needed
    if (!data.bookingReference) {
      data.bookingReference = generateBookingReference();
    }

    // 4. Save to sheet
    const result = saveBookingToSheet(data);

    if (!result.success) {
      throw new Error(result.message || 'Unknown error saving booking');
    }

    // 5. Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Booking saved successfully!',
        bookingReference: data.bookingReference,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');

  } catch (error) {
    // 6. Handle errors
    Logger.log('❌ Error processing booking: ' + error.message);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: String(error),
        message: 'Please try again or contact support.',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'DNG Transport Booking System - API Active',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ======================= Utilities =======================
function generateBookingReference() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DNG${year}${month}${day}${random}`;
}

function archiveAndResetSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    createOrUpdateBookingSheet();
    return 'Created new sheet (no previous sheet to archive).';
  }

  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  const archiveName = `${SHEET_NAME}_Archive_${stamp}`;
  sheet.copyTo(ss).setName(archiveName);
  ss.setActiveSheet(ss.getSheetByName(SHEET_NAME));

  createOrUpdateBookingSheet();
  return `Archived as ${archiveName} and rebuilt ${SHEET_NAME}.`;
}

function clearDataOnly() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || createOrUpdateBookingSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    sheet.getRange(3, 1, lastRow - 2, HEADERS.length).clearContent();
  }
  return 'Cleared data rows; headers and formatting preserved.';
}
