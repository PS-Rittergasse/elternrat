/**
 * Elternrat Backend (Google Apps Script)
 *
 * Features:
 * - sendEmail via GmailApp
 * - uploadBase64 to Google Drive (returns file URL)
 *
 * Auth: optional API_KEY in Script Properties.
 * - If API_KEY is set (non-empty), every request must include payload.apiKey.
 *
 * Frontend note:
 * - Use plain text JSON body (default fetch for string) to avoid CORS preflight.
 */

var VERSION = '1.0.0';

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  try {
    if (action === 'ping') {
      return jsonOk({ version: VERSION });
    }
    return jsonErr('Unknown action');
  } catch (err) {
    return jsonErr(String(err));
  }
}

function doPost(e) {
  try {
    var payload = parsePayload(e);
    var action = payload.action;
    if (!action) return jsonErr('Missing action');

    if (!isAuthorized(payload)) {
      return jsonErr('Unauthorized');
    }

    if (action === 'ping') {
      return jsonOk({ version: VERSION });
    }

    if (action === 'sendEmail') {
      var data = handleSendEmail(payload);
      return jsonOk(data);
    }

    if (action === 'uploadBase64') {
      var up = handleUploadBase64(payload);
      return jsonOk(up);
    }

    return jsonErr('Unknown action');
  } catch (err) {
    return jsonErr(String(err && err.message ? err.message : err));
  }
}

function parsePayload(e) {
  // Supports:
  // - plain text JSON: e.postData.contents
  // - urlencoded: e.parameter.payload
  if (e && e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    // Some clients might send "payload=<json>" as text/plain
    if (raw.indexOf('payload=') === 0) {
      raw = decodeURIComponent(raw.slice('payload='.length));
    }
    return JSON.parse(raw);
  }
  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e && e.parameter && Object.keys(e.parameter).length) {
    // fallback: treat parameters as payload
    return e.parameter;
  }
  return {};
}

function isAuthorized(payload) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty('API_KEY') || '').trim();
  if (!apiKey) {
    // No key configured => allow
    return true;
  }
  return String(payload.apiKey || '').trim() === apiKey;
}

function handleSendEmail(payload) {
  var to = normalizeArray(payload.to);
  var cc = normalizeArray(payload.cc);
  var bcc = normalizeArray(payload.bcc);
  var subject = String(payload.subject || '').trim();
  var body = String(payload.body || '');
  var htmlBody = payload.htmlBody ? String(payload.htmlBody) : null;
  var sendMode = String(payload.sendMode || 'single'); // 'single' | 'bcc'

  if (!subject) throw new Error('Betreff fehlt');
  if (!body && !htmlBody) throw new Error('Text fehlt');

  var opts = {};
  if (cc.length) opts.cc = cc.join(',');
  if (htmlBody) opts.htmlBody = htmlBody;

  var sent = 0;

  if (sendMode === 'bcc') {
    if (!to.length) throw new Error('To fehlt');
    if (bcc.length) opts.bcc = bcc.join(',');
    GmailApp.sendEmail(to[0], subject, body || stripHtml(htmlBody), opts);
    sent = 1;
  } else {
    // Send individually
    if (!to.length) throw new Error('Empfänger fehlt');
    for (var i = 0; i < to.length; i++) {
      GmailApp.sendEmail(to[i], subject, body || stripHtml(htmlBody), opts);
      sent++;
    }
  }

  return { sent: sent };
}

function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function handleUploadBase64(payload) {
  var fileName = String(payload.fileName || 'upload');
  var mimeType = String(payload.mimeType || 'application/octet-stream');
  var base64 = String(payload.base64 || '');
  var folderId = String(payload.folderId || '');
  var autoShareLink = payload.autoShareLink === true || payload.autoShareLink === 'true';

  if (!base64) throw new Error('base64 fehlt');

  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, mimeType, fileName);

  var file;
  if (folderId) {
    var folder = DriveApp.getFolderById(folderId);
    file = folder.createFile(blob);
  } else {
    file = DriveApp.createFile(blob);
  }

  if (autoShareLink) {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  return {
    fileId: file.getId(),
    webViewLink: file.getUrl(),
    name: file.getName(),
    mimeType: file.getMimeType(),
    size: file.getSize()
  };
}

function normalizeArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  // allow comma separated string
  if (typeof v === 'string') {
    return v
      .split(/[,;\n]/g)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }
  return [String(v)];
}

function jsonOk(data) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonErr(message) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(message) }))
    .setMimeType(ContentService.MimeType.JSON);
}
