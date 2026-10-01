// Install as a script bound to the supplied spreadsheet. Keep the secret in
// Script Properties, never in this source or the public client bundle.
const SPREADSHEET_ID = '1LNQX9coVc9r-EzbsMKlqDcyFlKqYCKBLi-RL4KtV55Y';

function doPost(event) {
  const json = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(event.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('JOURNEY_SECRET');
    if (!secret || secret.length < 32 || data.secret !== secret || data.spreadsheetId !== SPREADSHEET_ID) return json({ok:false});
    if (!/^[\da-f-]{36}$/i.test(data.id || '') || !['rsvp','song'].includes(data.kind)) return json({ok:false});
    const isRsvp = data.kind === 'rsvp';
    const keys = isRsvp ? ['name','attendance','companions','allergies','menu','message'] : ['song'];
    if (keys.some(key => typeof data[key] !== 'string' || data[key].length > 2000)) return json({ok:false});
    if (isRsvp && (!data.name.trim() || !['yes','no'].includes(data.attendance) || !/^[0-5]$/.test(data.companions))) return json({ok:false});
    if (!isRsvp && (!data.song.trim() || data.song.length > 500)) return json({ok:false});
    lock.waitLock(10000);
    const workbook = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = workbook.getSheetByName(isRsvp ? 'INVITADOS' : 'MUSICA');
    if (!sheet) return json({ok:false});
    const headers = isRsvp
      ? ['ID','Fecha de envío','Nombre completo','Asistencia','Acompañantes','Alergias / restricciones','Menú','Mensaje']
      : ['ID','Fecha de envío','Canción'];
    if (sheet.getLastRow() === 0) sheet.getRange(1,1,1,headers.length).setValues([headers]);
    const existingHeaders = sheet.getRange(1,1,1,headers.length).getDisplayValues()[0];
    if (headers.some((header,index) => header !== existingHeaders[index])) return json({ok:false});
    // One stable random submission ID: retries and edits update the same row.
    const lastRow = sheet.getLastRow();
    const match = lastRow > 1 ? sheet.getRange(2,1,lastRow-1,1).createTextFinder(data.id).matchEntireCell(true).findNext() : null;
    const row = match ? match.getRow() : lastRow + 1;
    const safe = value => /^[=+\-@\t\r]/.test(String(value)) ? "'" + value : String(value);
    const values = isRsvp
      ? [data.id,new Date().toISOString(),data.name.trim(),data.attendance === 'yes' ? 'Sí' : 'No',data.companions,data.allergies,data.menu,data.message]
      : [data.id,new Date().toISOString(),data.song.trim()];
    sheet.getRange(row,1,1,values.length).setNumberFormat('@').setValues([values.map(safe)]);
    SpreadsheetApp.flush();
    return json({ok:true,id:data.id});
  } catch (_) {
    return json({ok:false});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
