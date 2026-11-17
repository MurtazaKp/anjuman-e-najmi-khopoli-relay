/**
 * Anjuman E Najmi Khopoli — Google Apps Script for Google Sheets Live Data Sync
 * Headers on Row 4 (A4:I4), Data rows fill starting at Row 5 (A5:I5)
 * Columns: ITS ID, Name, Status, Gender, Mobile Number, Mauze, Transportation, Niyaz Jaman, Niyaz Contribution
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "healthy", service: "Khopoli Relay Google Sheets Sync" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Prevent concurrent write race conditions

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var eventName = data.eventName || "Zikrah Waaz Majlis 1448H";
    var tabName = data.tabName || eventName || "Zikrah Waaz Majlis 1448H";

    // Explicitly target event tab (auto-create if it doesn't exist yet)
    var sheet = ss.getSheetByName(tabName) || ss.getSheetByName(eventName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }

    // 1. Full Sync Action (Clears sheet and writes formatted rectangular 2D array of all families)
    if (data.action === "FULL_SYNC") {
      sheet.clearContents();
      if (data.rows && data.rows.length > 0) {
        var maxCols = 9;
        for (var i = 0; i < data.rows.length; i++) {
          if (data.rows[i] && data.rows[i].length > maxCols) {
            maxCols = data.rows[i].length;
          }
        }
        var rectRows = data.rows.map(function(r) {
          var row = (r || []).slice();
          while (row.length < maxCols) row.push("");
          return row.slice(0, maxCols);
        });
        sheet.getRange(1, 1, rectRows.length, maxCols).setValues(rectRows);
        if (rectRows.length >= 4) {
          sheet.getRange(4, 1, 1, maxCols).setFontWeight("bold");
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", mode: "FULL_SYNC", totalRows: data.rows ? data.rows.length : 0, tab: sheet.getName() }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Targeted Row Deletion Action (Deletes specific rows by ITS ID without clearing the sheet)
    if (data.action === "DELETE_ITS" || data.action === "CANCEL_REGISTRATION") {
      var itsList = data.itsIds || (data.itsId ? [data.itsId] : []);
      var itsSet = {};
      itsList.forEach(function(id) {
        itsSet[String(id).replace(/\.0+$/, "").trim()] = true;
      });

      var lastRow = sheet.getLastRow();
      var deletedCount = 0;
      if (lastRow >= 5) {
        var colAValues = sheet.getRange(1, 1, lastRow, 1).getValues();
        for (var r = lastRow; r >= 5; r--) {
          var val = String(colAValues[r - 1][0] || "").replace(/\.0+$/, "").trim();
          if (val && itsSet[val]) {
            sheet.deleteRow(r);
            deletedCount++;
          }
        }
      }

      if (data.updatedHof && data.updatedHof.itsId) {
        var newHofIts = String(data.updatedHof.itsId).replace(/\.0+$/, "").trim();
        var curLastRow = sheet.getLastRow();
        if (curLastRow >= 5) {
          var checkA = sheet.getRange(5, 1, curLastRow - 4, 1).getValues();
          for (var i = 0; i < checkA.length; i++) {
            if (String(checkA[i][0]).replace(/\.0+$/, "").trim() === newHofIts) {
              var targetRow = 5 + i;
              sheet.getRange(targetRow, 3).setValue("HOF");
              if (data.updatedHof.mobileNumber) {
                sheet.getRange(targetRow, 5).setValue(data.updatedHof.mobileNumber);
              }
              break;
            }
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "DELETE_ITS",
        deletedCount: deletedCount,
        tab: sheet.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var family = data.family;

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
