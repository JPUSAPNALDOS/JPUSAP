// Spinner Interceptor mejorado
(function(){
  const spinner = document.getElementById('global-spinner');
  const origFetch = window.fetch;
  window.fetch = function(...args){
    spinner.classList.add('show');
    return origFetch.apply(this, args)
      .finally(()=> spinner.classList.remove('show'));
  };
})();

// --- Configuración Google Sheets ---
const config = {
  sheetId: "1T8EncGlUe0X20Carupv8vRNhxYz_jGYJlj_s_5nITsQ",
  apiKey: "AIzaSyBbQqXlcuEkflDUVOQtXHCJN_HMiFQHhmE"
};
const SHEET_URL = (sheet) => `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${sheet}?key=${config.apiKey}`;

// --- Utilidad fetch para obtener filas ---
async function getSheetRows(sheetName) {
  const res = await fetch(SHEET_URL(sheetName));
  if (!res.ok) throw new Error(res.statusText);
  const data = await res.json();
  return data.values || [];
}

// --- Tabs mejorados ---
const tabs = document.querySelectorAll('.tab');
const contenidos = document.querySelectorAll('.contenido-tab');

tabs.forEach(tab => tab.addEventListener('click', function(){
  tabs.forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', "false");
  });
  contenidos.forEach(c => c.classList.remove('active'));
  this.classList.add('active');
  this.setAttribute('aria-selected', "true");
  const target = document.getElementById(this.dataset.target);
  if (target) {
    target.classList.add('active');
    // Limpia los campos/resultados de todos los paneles
    contenidos.forEach(sec => {
      sec.querySelectorAll('input').forEach(i => { if(i.type!=='button' && !i.hasAttribute('readonly')) i.value = ''; });
      sec.querySelectorAll('div[aria-live]').forEach(d => d.textContent = '');
    });
    // Foco automático en el primer input del tab
    const input = target.querySelector('input:not([readonly])');
    if(input) input.focus();
  }
}));

// --- Verificación de placa ---
async function verificarPlaca() {
  const placaInput = document.getElementById("placaInput");
  const resultadoDiv = document.getElementById("resultado");
  const placa = placaInput.value.trim().toUpperCase();
  if (!placa) {
    resultadoDiv.textContent = "⚠️ Ingresa una placa válida.";
    resultadoDiv.style.color = "red";
    return;
  }
  try {
    const filas = await getSheetRows("VERIFICACION");
    let estado = "NO ENCONTRADO", cuenta = "SIN DATOS",
        mz = "", lote = "", etapa = "", meses = "";
    for (let i = 1; i < filas.length; i++) {
      if (filas[i][0]?.toUpperCase() === placa) {
        estado = filas[i][1]?.toUpperCase() || estado;
        cuenta = filas[i][2]?.toUpperCase() || cuenta;
        mz     = filas[i][3] || "";
        lote   = filas[i][4] || "";
        etapa  = filas[i][5] || "";
        meses  = filas[i][6] || "";
        break;
      }
    }
    resultadoDiv.innerHTML = `
      <span id="estadoSpan">🔍 Estado: ${estado}</span><br>
      <span id="estadoCuentaSpan">💰 Estado de Cuenta: ${cuenta}</span>
    `;
    document.getElementById("estadoSpan").style.color =
      (estado==="APORTANTE"?"green":estado==="NO APORTANTE"?"orange":"red");
    document.getElementById("estadoCuentaSpan").style.color =
      (cuenta==="ESTABLE"?"green":cuenta==="RETRASO DE DEUDA"?"red":"black");
    // Autorellena en la pestaña de deuda
    document.getElementById("mz").value             = mz;
    document.getElementById("lote").value           = lote;
    document.getElementById("etapa").value          = etapa;
    document.getElementById("mesesAdeudados").value = meses;
  } catch (err) {
    resultadoDiv.textContent = `🚨 ${err.message}`;
    resultadoDiv.style.color = "red";
  }
}

// --- Verificar Deuda ---
async function verificarDeuda() {
  const mzValue    = document.getElementById("mz").value.trim().toUpperCase();
  const loteValue  = document.getElementById("lote").value.trim().toUpperCase();
  const etapaValue = document.getElementById("etapa").value.trim().toUpperCase();
  const out        = document.getElementById("mesesAdeudados");
  if (!mzValue || !loteValue || !etapaValue) {
    out.value = "⚠️ Rellene Mz, Lote y Etapa.";
    return;
  }
  try {
    const filas = await getSheetRows("VERIFICACION");
    let encontrado = "NO ENCONTRADO";
    for (let i = 1; i < filas.length; i++) {
      const row = filas[i];
      if (row[3]?.toUpperCase()===mzValue &&
          row[4]?.toUpperCase()===loteValue &&
          row[5]?.toUpperCase()===etapaValue) {
        encontrado = row[6]||"0";
        break;
      }
    }
    out.value = encontrado;
  } catch (err) {
    out.value = `🚨 ${err.message}`;
  }
}

// --- Soporte ENTER para placa y deuda ---
document.getElementById("placaInput").addEventListener("keydown", e => e.key==="Enter" && verificarPlaca());
["mz","lote","etapa"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", e => e.key==="Enter" && verificarDeuda());
});

// --- Plugin “Limpiar” universal ---
document.querySelectorAll('.btn-clear').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.closest('section, .contenido-tab');
    if (!panel) return;
    panel.querySelectorAll('input').forEach(i => { if(i.type!=='button' && !i.hasAttribute('readonly')) i.value = ''; });
    panel.querySelectorAll('div[aria-live]').forEach(d => d.textContent = '');
    // Esconde video si está en panel DNI
    const reader = panel.querySelector('#reader');
    if(reader) reader.style.display = 'none';
  });
});

// --- Config hoja de DNI ---
const dniSheetName = "RESIDENTES";

// --- Buscar DNI ---
async function buscarDni(dni) {
  const resDiv = document.getElementById("resultadoDni");
  resDiv.textContent = "Buscando…";
  try {
    const values = await getSheetRows(dniSheetName);
    const fila = values.find((row, i) => i > 0 && row[0] === dni);
    if (!fila) {
      resDiv.innerHTML = `<span style="color:orange">❓ DNI no encontrado</span>`;
      return;
    }
    const esResidente = (fila[1]||"").toUpperCase() === "SI";
    const esAportante = (fila[2]||"").toUpperCase() === "SI";
    resDiv.innerHTML = `
      <span style="color:${esResidente?"green":"red"}">
        ${ esResidente ? "✅ Es residente" : "❌ No es residente" }
      </span><br>
      <span style="color:${esAportante?"green":"red"}">
        ${ esAportante ? "✅ Es aportante" : "❌ No es aportante" }
      </span>
    `;
  } catch (err) {
    resDiv.innerHTML = `<span style="color:red">🚨 ${err.message}</span>`;
  }
}

// --- Escanear DNI (ZXing) ---
async function startDniScan() {
  const readerEl = document.getElementById("reader");
  readerEl.style.display = "block";
  try {
    await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }});
  } catch (permErr) {
    alert("No permitiste acceso a cámara");
    readerEl.style.display = "none";
    return;
  }
  const cams = (await navigator.mediaDevices.enumerateDevices())
                .filter(dev => dev.kind === "videoinput");
  if (!cams.length) {
    alert("No se encontró ninguna cámara");
    readerEl.style.display = "none";
    return;
  }
  const codeReader = new ZXing.BrowserMultiFormatReader();
  codeReader
    .decodeFromVideoDevice(null, "reader", (result, err) => {
      if (result) {
        codeReader.reset();
        readerEl.style.display = "none";
        document.getElementById("dniInput").value = result.getText();
        buscarDni(result.getText());
      }
    })
    .catch(scanErr => {
      alert("No se pudo arrancar el escáner: " + scanErr.message);
      readerEl.style.display = "none";
    });
}

// --- Botones y ENTER para DNI ---
document.getElementById("btnActivateCam").addEventListener("click", startDniScan);
document.getElementById("btnVerificarDni").addEventListener("click", () => {
  const dni = document.getElementById("dniInput").value.trim();
  if (dni) buscarDni(dni);
});
document.getElementById("dniInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const dni = e.target.value.trim();
    if (dni) buscarDni(dni);
  }
});

// --- Botón verificar de placa y deuda ---
document.getElementById("btnVerificarPlaca").addEventListener("click", verificarPlaca);
document.getElementById("btnVerificarDeuda").addEventListener("click", verificarDeuda);
