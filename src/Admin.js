/**
 * Admin.gs — Admin tools for managing payments.
 *
 * Adds a "Registration Admin" menu to the spreadsheet with a "Record Payment" option.
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Registration Admin')
    .addItem('Record Payment', 'showPaymentSidebar')
    .addToUi();
}

function showPaymentSidebar() {
  var html = HtmlService.createHtmlOutput(getPaymentSidebarHtml())
    .setTitle('Record Payment')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getUnpaidRegistrations() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var status = String(data[i][headers.indexOf('PaymentStatus')] || '').toLowerCase();
    if (status.indexOf('paid') < 0 || status.indexOf('unpaid') >= 0) {
      results.push({
        id: data[i][0],
        name: data[i][4],
        email: data[i][2],
        total: data[i][headers.indexOf('TotalDue')] || 0
      });
    }
  }
  return JSON.stringify(results);
}

function getPaymentSidebarHtml() {
  return '<!DOCTYPE html><html><head><style>' +
    'body{font-family:Arial,sans-serif;padding:12px;font-size:13px}' +
    'select,input{width:100%;padding:8px;margin:4px 0 12px;border:1px solid #ccc;border-radius:4px;font-size:13px;box-sizing:border-box}' +
    'label{font-weight:bold;display:block;margin-top:8px}' +
    'button{width:100%;padding:10px;background:#1a5490;color:#fff;border:none;border-radius:4px;font-size:14px;cursor:pointer;font-weight:bold}' +
    'button:disabled{opacity:0.5}' +
    '.success{background:#d4edda;color:#155724;padding:12px;border-radius:4px;margin-top:12px}' +
    '.error{background:#f8d7da;color:#721c24;padding:12px;border-radius:4px;margin-top:12px}' +
    '</style></head><body>' +
    '<h3 style="margin:0 0 12px;color:#1a5490">Record Payment</h3>' +
    '<label>Registration</label>' +
    '<select id="regId"><option value="">Loading...</option></select>' +
    '<div id="regInfo" style="font-size:12px;color:#666;margin-bottom:8px"></div>' +
    '<label>Payment Method</label>' +
    '<input id="method" placeholder="e.g., Check 1234, Zelle 5/13">' +
    '<label>Amount</label>' +
    '<input id="amount" type="number" step="0.01" min="0">' +
    '<label>Notes (optional)</label>' +
    '<input id="notes" placeholder="e.g., received 5/13">' +
    '<button id="btn" onclick="record()">Record Payment</button>' +
    '<div id="result"></div>' +
    '<script>' +
    'google.script.run.withSuccessHandler(function(raw){' +
    '  var regs=JSON.parse(raw);var sel=document.getElementById("regId");' +
    '  sel.innerHTML="<option value=\\"\\">Select registration...</option>";' +
    '  for(var i=0;i<regs.length;i++){' +
    '    sel.innerHTML+="<option value=\\""+regs[i].id+"\\" data-total=\\""+regs[i].total+"\\">"+regs[i].id+" - "+regs[i].name+"</option>";' +
    '  }' +
    '}).getUnpaidRegistrations();' +
    'document.getElementById("regId").onchange=function(){' +
    '  var opt=this.options[this.selectedIndex];' +
    '  var total=opt.getAttribute("data-total")||"";' +
    '  document.getElementById("amount").value=total;' +
    '  document.getElementById("regInfo").textContent=total?"Amount due: $"+Number(total).toFixed(2):"";' +
    '};' +
    'function record(){' +
    '  var id=document.getElementById("regId").value;' +
    '  var method=document.getElementById("method").value.trim();' +
    '  var amount=Number(document.getElementById("amount").value);' +
    '  var notes=document.getElementById("notes").value.trim();' +
    '  if(!id||!method||!amount){alert("Please fill in registration, method, and amount.");return;}' +
    '  document.getElementById("btn").disabled=true;' +
    '  google.script.run.withSuccessHandler(function(){' +
    '    document.getElementById("result").innerHTML="<div class=\\"success\\">✓ Payment recorded!</div>";' +
    '    document.getElementById("btn").disabled=false;' +
    '    document.getElementById("regId").querySelector("option[value=\\""+id+"\\"]").remove();' +
    '  }).withFailureHandler(function(e){' +
    '    document.getElementById("result").innerHTML="<div class=\\"error\\">Error: "+e.message+"</div>";' +
    '    document.getElementById("btn").disabled=false;' +
    '  }).recordManualPayment(id,method,amount,notes);' +
    '}' +
    '</script></body></html>';
}
