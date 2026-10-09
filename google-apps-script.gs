/* =====================================================================
   Little Bites — Google Apps Script backend
   Paste ALL of this into your Google Sheet's Apps Script editor
   (Extensions -> Apps Script), then Deploy as a Web app.
   Execute as: Me   |   Who has access: Anyone
   This saves your app data as a single row in a sheet tab called "Data".
   ===================================================================== */

var SHEET_NAME = "Data";

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1).setValue("littleBitesData"); // header
  }
  return sh;
}

// Called when the app loads data (GET ?action=load)
function doGet(e) {
  try {
    var sh = getSheet_();
    var cell = sh.getRange(2, 1).getValue();
    var data = cell ? JSON.parse(cell) : null;
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Called when the app saves data (POST {action:"save", data:{...}})
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === "save") {
      var sh = getSheet_();
      sh.getRange(2, 1).setValue(JSON.stringify(body.data));
      sh.getRange(2, 2).setValue(new Date());        // last-saved timestamp (readable)
      return json_({ ok: true });
    }
    return json_({ ok: false, error: "unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
