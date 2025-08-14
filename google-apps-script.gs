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

function doPost(e) {
  try {
    // Parse incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Add timestamp and booking reference
    data.timestamp = new Date();
    if (!data.bookingReference) {
      data.bookingReference = generateBookingReference();
    }
    
    // Map to sheet columns
    const rowData = HEADERS.map(header => {
      switch(header) {
        case 'Date & Time': return data.timestamp;
        case 'Booking ID': return data.bookingReference;
        case 'Bus Type': return data.busType === 'vip' ? 'VIP' : 'Sprinter';
        case 'Payment Status': return data.paymentStatus || 'UnPaid';
        case 'Travel Date': return new Date(data.travelDate);
        case 'Price': return parseFloat(data.price) || 0;
        default:
          // Convert header to camelCase for matching
          const camelKey = header.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase());
          return data[camelKey] || '';
      }
    });
    
    // Append to sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow(rowData);
    
    // Apply formatting to new row
    const lastRow = sheet.getLastRow();
    const newRowRange = sheet.getRange(lastRow, 1, 1, HEADERS.length);
    
    // Basic formatting
    newRowRange
      .setFontFamily('Arial')
      .setFontSize(9)
      .setVerticalAlignment('middle');
    
    // Bus type highlighting
    const busTypeIndex = HEADERS.indexOf('Bus Type') + 1;
    if (data.busType === 'vip') {
      sheet.getRange(lastRow, busTypeIndex).setBackground('#fef3c7').setFontWeight('bold');
    }
    
    // Payment status coloring
    const paymentIndex = HEADERS.indexOf('Payment Status') + 1;
    const paymentStatus = data.paymentStatus || 'UnPaid';
    if (paymentStatus === 'Paid') {
      sheet.getRange(lastRow, paymentIndex).setBackground('#10b981').setFontColor('#ffffff');
    } else if (paymentStatus === 'UnPaid') {
      sheet.getRange(lastRow, paymentIndex).setBackground('#fee2e2').setFontColor('#b91c1c');
    } else if (paymentStatus === 'Partial') {
      sheet.getRange(lastRow, paymentIndex).setBackground('#fef3c7').setFontColor('#92400e');
    }
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, HEADERS.length);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      bookingReference: data.bookingReference
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Utility functions remain the same
function generateBookingReference() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DNG${year}${month}${day}${random}`;
}

// Add this for CORS support
function doOptions() {
  return ContentService.createTextOutput()
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '3600');
}
