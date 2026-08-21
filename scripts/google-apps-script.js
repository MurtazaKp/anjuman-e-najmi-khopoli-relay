/**
 * Anjuman E Najmi Khopoli — Google Apps Script for Google Sheets Live Data Sync
 * Headers on Row 4 (A4:I4), Data rows fill starting at Row 5 (A5:I5)
 * Columns: ITS ID, Name, Status, Gender, Mobile Number, Mauze, Transportation, Niyaz Jaman, Niyaz Contribution
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Prevent concurrent write race conditions

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // 1. Full Sync Action (Clears sheet and writes formatted 2D array of all families)
    if (data.action === "FULL_SYNC" && data.rows && data.rows.length > 0) {
      sheet.clearContents();
      sheet.getRange(1, 1, data.rows.length, data.rows[0].length).setValues(data.rows);
      if (data.rows.length >= 4) {
        sheet.getRange(4, 1, 1, data.rows[0].length).setFontWeight("bold");
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", mode: "FULL_SYNC", totalRows: data.rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var family = data.family;
    var eventName = data.eventName || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H";

    // 2. Set Sheet Header if sheet is completely empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 1).setValue("KHOPOLI RELAY CENTRE");
      sheet.getRange(2, 1, 1, 1).setValue(eventName);
      sheet.getRange(4, 1, 1, 9).setValues([[
        "ITS",
        "Name",
        "Status",
        "Gender",
        "Phone No",
        "Mauze",
        "Mode of Transportation",
        "Will Have Niyaz",
        "Niyaz Contribution"
      ]]);
      sheet.getRange(4, 1, 1, 9).setFontWeight("bold");
    }

    // 3. Single Family Append Action (with Duplicate ITS check)
    if (family && family.members && family.members.length > 0) {
      var lastRow = Math.max(sheet.getLastRow(), 4);
      var existingItsSet = {};
      var allColA = sheet.getRange(1, 1, lastRow, 1).getValues();

      for (var r = 0; r < allColA.length; r++) {
        var cellVal = allColA[r][0];
        if (cellVal !== null && cellVal !== undefined && cellVal !== "") {
          var cleanVal = String(cellVal).replace(/\.0+$/, "").trim();
          if (cleanVal) {
            existingItsSet[cleanVal] = true;
          }
        }
      }

      var nextRow = lastRow + 1;
      var rowsToAdd = [];

      family.members.forEach(function(m, idx) {
        var cleanIts = String(m.itsId).replace(/\.0+$/, "").trim();
        if (cleanIts && !existingItsSet[cleanIts]) {
          var contribVal = idx === 0 ? (family.niyazContribution || "—") : "—";
          if (contribVal !== "—" && contribVal !== "Je Imkaan Thase") {
            var rawNumeric = String(contribVal).replace(/,/g, "").trim();
            if (rawNumeric && !isNaN(rawNumeric)) {
              contribVal = Number(rawNumeric);
            }
          }

          var genderDisplay = (m.type === "Child" || m.gender === "Child" || m.gender === "Gair Baligh")
            ? "Gair Baligh"
            : (m.gender + " Adult");

          rowsToAdd.push([
            cleanIts,
            m.name,
            m.status,
            genderDisplay,
            m.mobileNumber,
            family.mauze || "—",
            family.transportMode || "—",
            family.niyazJaman || "—",
            contribVal
          ]);
          existingItsSet[cleanIts] = true;
        }
      });

      if (rowsToAdd.length > 0) {
        sheet.getRange(nextRow, 1, rowsToAdd.length, 9).setValues(rowsToAdd);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", mode: "SINGLE_FAMILY" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
