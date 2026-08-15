/**
 * Anjuman E Najmi Khopoli — Google Apps Script for Google Sheets Live Data Sync
 * Headers on Row 4 (A4:J4), Data rows fill starting at Row 5 (A5:J5)
 * Columns: ITS ID, Name, Status, Gender, Type, Mobile Number, Mauze, Transportation, Niyaz Jaman, Niyaz Contribution
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var family = data.family;
    var eventName = data.eventName || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H";

    // Set Sheet Header if sheet is completely empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 1).setValue("KHOPOLI RELAY CENTRE");
      sheet.getRange(2, 1, 1, 1).setValue(eventName);
      sheet.getRange(4, 1, 1, 10).setValues([[
        "ITS ID",
        "Name",
        "Status",
        "Gender",
        "Type",
        "Mobile Number",
        "Mauze",
        "Transportation",
        "Niyaz Jaman",
        "Niyaz Contribution"
      ]]);
      sheet.getRange(4, 1, 1, 10).setFontWeight("bold");
    }

    // Read ALL existing values in Column A across entire sheet to prevent duplicates
    var lastRow = Math.max(sheet.getLastRow(), 4);
    var existingItsSet = {};
    var allColA = sheet.getRange(1, 1, lastRow, 1).getValues();
    var lastFilledRow = 4; // Headers are on Row 4

    for (var r = 0; r < allColA.length; r++) {
      var cellVal = allColA[r][0];
      if (cellVal !== null && cellVal !== undefined && cellVal !== "") {
        var rowNum = r + 1;
        if (rowNum >= 5) {
          lastFilledRow = Math.max(lastFilledRow, rowNum);
        }
        var cleanVal = String(cellVal).replace(/\.0+$/, "").trim();
        if (cleanVal) {
          existingItsSet[cleanVal] = true;
        }
      }
    }

    // Next insertion row starts at lastFilledRow + 1 (minimum Row 5)
    var nextRow = Math.max(5, lastFilledRow + 1);

    // Append Family Members starting at Row 5
    if (family && family.members) {
      family.members.forEach(function(m, idx) {
        var cleanIts = String(m.itsId).replace(/\.0+$/, "").trim();
        if (cleanIts && !existingItsSet[cleanIts]) {
          // Format Niyaz Contribution as a pure Number if numeric
          var contribVal = idx === 0 ? (family.niyazContribution || "—") : "—";
          if (contribVal !== "—" && contribVal !== "Je Imkaan Thase") {
            var rawNumeric = String(contribVal).replace(/,/g, "").trim();
            if (rawNumeric && !isNaN(rawNumeric)) {
              contribVal = Number(rawNumeric);
            }
          }

          var rowData = [
            cleanIts,
            m.name,
            m.status,
            m.gender,
            m.type,
            m.mobileNumber,
            family.mauze || "—",
            family.transportMode || "—",
            family.niyazJaman || "—",
            contribVal
          ];
          sheet.getRange(nextRow, 1, 1, 10).setValues([rowData]);
          existingItsSet[cleanIts] = true;
          nextRow++;
        }
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
