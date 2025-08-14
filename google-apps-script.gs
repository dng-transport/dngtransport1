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
  // Set CORS headers first
  const response = ContentService.createTextOutput();
  response.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Add timestamp and booking reference
    data.timestamp = new Date();
    if (!data.bookingReference) {
      data.bookingReference = generateBookingReference();
    }
    
    // Open sheet and append data
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || createSheet(ss);
    
    const rowData = HEADERS.map(header => mapHeader(header, data));
    sheet.appendRow(rowData);
    
    // Apply formatting
    formatNewRow(sheet, sheet.getLastRow(), data);
    
    // Return success response
    response.setContent(JSON.stringify({
      success: true,
      bookingReference: data.bookingReference,
      timestamp: data.timestamp.toISOString()
    }));
    
  } catch (error) {
    // Return error response
    response.setContent(JSON.stringify({
      success: false,
      error: error.message,
      message: "Booking failed. Please try again."
    }));
  }
  
  response.setMimeType(ContentService.MimeType.JSON);
  return response;
}

// Required CORS preflight handler
function doOptions() {
  return ContentService.createTextOutput()
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '3600');
}

// Helper functions
function mapHeader(header, data) {
  switch(header) {
    case 'Date & Time': return data.timestamp;
    case 'Booking ID': return data.bookingReference;
    case 'Bus Type': return data.busType === 'vip' ? 'VIP' : 'Sprinter';
    case 'Payment Status': return data.paymentStatus || 'UnPaid';
    case 'Travel Date': return new Date(data.travelDate);
    case 'Price': return parseFloat(data.price) || 0;
    default:
      const camelKey = header.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase());
      return data[camelKey] || '';
  }
}

function formatNewRow(sheet, row, data) {
  const range = sheet.getRange(row, 1, 1, HEADERS.length);
  
  // Basic formatting
  range
    .setFontFamily('Arial')
    .setFontSize(9)
    .setVerticalAlignment('middle');
  
  // Bus type highlighting
  const busCol = HEADERS.indexOf('Bus Type') + 1;
  if (data.busType === 'vip') {
    sheet.getRange(row, busCol).setBackground('#fef3c7').setFontWeight('bold');
  }
  
  // Payment status coloring
  const paymentCol = HEADERS.indexOf('Payment Status') + 1;
  const paymentStatus = data.paymentStatus || 'UnPaid';
  
  if (paymentStatus === 'Paid') {
    sheet.getRange(row, paymentCol).setBackground('#10b981').setFontColor('#ffffff');
  } else if (paymentStatus === 'UnPaid') {
    sheet.getRange(row, paymentCol).setBackground('#fee2e2').setFontColor('#b91c1c');
  } else if (paymentStatus === 'Partial') {
    sheet.getRange(row, paymentCol).setBackground('#fef3c7').setFontColor('#92400e');
  }
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, HEADERS.length);
}

function createSheet(ss) {
  const sheet = ss.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return sheet;
}

function generateBookingReference() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DNG${year}${month}${day}${random}`;
}
