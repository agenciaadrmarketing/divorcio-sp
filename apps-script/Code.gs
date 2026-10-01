/**
 * Recebe os leads do popup da LP Divórcio SP e grava na planilha
 * "DIVORCIO SP | Vieira e Marques - Planilha de Leads".
 *
 * A LP envia cada lead duas vezes (GET via pixel e POST via fetch no-cors),
 * por isso há deduplicação de 2 minutos com CacheService.
 */
var SPREADSHEET_ID = '1PAulss8q6FpJ2_8HfxoVOPkYV92NKaGnxJ9kTedUCOk';
var SHEET_NAME = 'Página1';
var COLUNAS = ['data', 'nome', 'email', 'whatsapp', 'utm_source', 'utm_medium', 'utm_campaign', 'pagina'];

function doGet(e) {
  return registrar_((e && e.parameter) || {});
}

function doPost(e) {
  var dados = {};
  try {
    dados = JSON.parse(e.postData.contents);
  } catch (err) {
    dados = (e && e.parameter) || {};
  }
  return registrar_(dados);
}

function registrar_(dados) {
  var nome = String(dados.nome || '').trim();
  var email = String(dados.email || '').trim();
  var whatsapp = String(dados.whatsapp || '').trim();
  if (!nome && !email && !whatsapp) return resposta_('ignorado');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var cache = CacheService.getScriptCache();
    var chave = Utilities.base64Encode(
      Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [nome, email, whatsapp].join('|').toLowerCase())
    );
    if (cache.get(chave)) return resposta_('duplicado');
    cache.put(chave, '1', 120);

    var linha = COLUNAS.map(function (col) {
      if (col === 'data') return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
      var v = String(dados[col] || '');
      // Evita que o Sheets interprete o valor como fórmula ou número (ex.: telefone).
      return /^[=+\-@]/.test(v) || col === 'whatsapp' ? "'" + v : v;
    });
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).appendRow(linha);
    return resposta_('ok');
  } finally {
    lock.releaseLock();
  }
}

function resposta_(status) {
  return ContentService.createTextOutput(JSON.stringify({ status: status }))
    .setMimeType(ContentService.MimeType.JSON);
}
