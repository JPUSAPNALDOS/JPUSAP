// ——— Spinner interceptor ———
;(function(){
  const spinner = document.getElementById('global-spinner');
  const origFetch = window.fetch;
  window.fetch = function(...args){
    spinner.classList.add('show');
    return origFetch.apply(this, args)
      .finally(()=> spinner.classList.remove('show'));
  };
})();

// ======== Configuración Google Sheets ========
const sheetId   = "1T8EncGlUe0X20Carupv8vRNhxYz_jGYJlj_s_5nITsQ";
const sheetName = "VERIFICACION";
const apiKey    = "AIzaSyBbQqXlcuEkflDUVOQtXHCJN_HMiFQHhmE";

// ——— Manejo de pestañas ———
const tabs       = document.querySelectorAll('.tab');
const contenidos = document.querySelectorAll('.contenido-tab');
tabs.forEach(tab => tab.addEventListener('click', function(){
  tabs.forEach(t => t.classList.remove('active'));
  contenidos.forEach(c => c.classList.remove('active'));
  this.classList.add('active');
  document.getElementById(this.dataset.target).classList.add('active');
}));

// ——— Función para verificar por placa ———
function verificarPlaca() {
  const placaInput   = document.getElementById("placaInput");
  const resultadoDiv = document.getElementById("resultado");
  const placa        = placaInput.value.trim().toUpperCase();
  
  if (!placa) {
    resultadoDiv.textContent = "⚠️ Ingresa una placa válida.";
    resultadoDiv.style.color = "red";
    return;
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`;
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      if (!data.values || !data.values.length) throw new Error("Hoja vacía");
      const filas = data.values;
      
      // Valores por defecto
      let estado = "NO ENCONTRADO",
          cuenta = "SIN DATOS",
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
      
      // Mostrar en “Verificación”
      resultadoDiv.innerHTML = `
        <span id="estadoSpan">🔍 Estado: ${estado}</span><br>
        <span id="estadoCuentaSpan">💰 Estado de Cuenta: ${cuenta}</span>
      `;
      document.getElementById("estadoSpan")
              .style.color = (estado==="APORTANTE"?"green":estado==="NO APORTANTE"?"orange":"red");
      document.getElementById("estadoCuentaSpan")
              .style.color = (cuenta==="ESTABLE"?"green":cuenta==="RETRASO DE DEUDA"?"red":"black");
      
      // Rellenar “Estado de Deuda”
      document.getElementById("mz").value             = mz;
      document.getElementById("lote").value           = lote;
      document.getElementById("etapa").value          = etapa;
      document.getElementById("mesesAdeudados").value = meses;
    })
    .catch(err => {
      resultadoDiv.textContent = `🚨 ${err.message}`;
      resultadoDiv.style.color = "red";
    });
}

// ——— Función para verificar deuda por Mz/Lote/Etapa ———
function verificarDeuda() {
  const mzValue    = document.getElementById("mz").value.trim().toUpperCase();
  const loteValue  = document.getElementById("lote").value.trim().toUpperCase();
  const etapaValue = document.getElementById("etapa").value.trim().toUpperCase();
  const out        = document.getElementById("mesesAdeudados");
  
  if (!mzValue || !loteValue || !etapaValue) {
    out.value = "⚠️ Rellene Mz, Lote y Etapa.";
    return;
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`;
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      if (!data.values || !data.values.length) throw new Error("Hoja vacía");
      const filas = data.values;
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
    })
    .catch(err => {
      out.value = `🚨 ${err.message}`;
    });
}

// ——— Soporte ENTER para placa y deuda ———
document.getElementById("placaInput")
        .addEventListener("keydown", e => e.key==="Enter" && verificarPlaca());
["mz","lote","etapa"].forEach(id => {
  document.getElementById(id)
          .addEventListener("keydown", e => e.key==="Enter" && verificarDeuda());
});

// ——— Plugin “Limpiar” ———
document.querySelectorAll('.btn-clear').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.closest('section, .contenido-tab');
    if (!panel) return;
    panel.querySelectorAll('input').forEach(i => i.value = '');
    document.getElementById('resultado').textContent = '';
  });
});

// —————————————————————————————————————————
// 1) Config para la nueva hoja de DNI
// —————————————————————————————————————————
const dniSheetName = "RESIDENTES";    // nombre exacto de la pestaña con DNI|Residente|Aportante

// —————————————————————————————————————————
// 2) Función que consulta SEL DNI (hoja RESIDENTES)
// —————————————————————————————————————————
function buscarDni(dni) {
  const resDiv = document.getElementById("resultadoDni");
  resDiv.textContent = "Buscando…";
  
  fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${dniSheetName}?key=${apiKey}`
  )
    .then(r => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then(data => {
      const values = data.values || [];
      const fila = values.find((row, i) => i > 0 && row[0] === dni);
      
      if (!fila) {
        resDiv.innerHTML = `<span style="color:orange">❓ DNI no encontrado</span>`;
        return;
      }
      
      // Lectura de columnas: [0]=DNI, [1]=Residente, [2]=Aportante
      const esResidente  = (fila[1]||"").toUpperCase() === "SI";
      const esAportante  = (fila[2]||"").toUpperCase() === "SI";
      
      // Mostrar resultado
      resDiv.innerHTML = `
        <span style="color:${esResidente?"green":"red"}">
          ${ esResidente ? "✅ Es residente" : "❌ No es residente" }
        </span><br>
        <span style="color:${esAportante?"green":"red"}">
          ${ esAportante ? "✅ Es aportante" : "❌ No es aportante" }
        </span>
      `;
    })
    .catch(err => {
      console.error(err);
      document.getElementById("resultadoDni")
              .innerHTML = `<span style="color:red">🚨 ${err.message}</span>`;
    });
}

// —————————————————————————————————————————
// **NUEVO**: Función para activar cámara y escanear DNI
// —————————————————————————————————————————
// ——————————————————————————————————
// Barcode/PDF417 con ZXing
// ——————————————————————————————————
async function startDniScan() {
  const readerEl = document.getElementById("reader");
  readerEl.style.display = "block";

  // 1) Pedimos permiso explícito
  try {
    await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }});
  } catch (permErr) {
    console.error("Permiso denegado o falló getUserMedia:", permErr);
    alert("No permitiste acceso a cámara");
    readerEl.style.display = "none";
    return;
  }

  // 2) Enumeramos dispositivos y vemos en consola
  const cams = (await navigator.mediaDevices.enumerateDevices())
                .filter(dev => dev.kind === "videoinput");
  console.log("Cámaras detectadas:", cams);
  if (!cams.length) {
    alert("No se encontró ninguna cámara");
    readerEl.style.display = "none";
    return;
  }

  // 3) Instanciamos ZXing y arrancamos el escaneo en el div#reader
  const codeReader = new ZXing.BrowserMultiFormatReader();
  codeReader
    .decodeFromVideoDevice(
      /* deviceId null = default camera */ null,
      "reader",
      (result, err) => {
        if (result) {
          console.log("Código leído:", result.getText());
          codeReader.reset();
          readerEl.style.display = "none";
          document.getElementById("dniInput").value = result.getText();
          buscarDni(result.getText());
        }
        // los errores de frame llegan aquí, los ignoramos
      }
    )
    .catch(scanErr => {
      console.error("Error al iniciar ZXing:", scanErr);
      alert("No se pudo arrancar el escáner: " + scanErr.message);
      readerEl.style.display = "none";
    });
}

// —————————————————————————————————————————
// 4) Hook de botones y ENTER para DNI
// —————————————————————————————————————————
document.getElementById("btnActivateCam")
  .addEventListener("click", startDniScan);

document.getElementById("btnVerificarDni")
  .addEventListener("click", () => {
    const dni = document.getElementById("dniInput").value.trim();
    if (dni) buscarDni(dni);
  });

document.getElementById("dniInput")
  .addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const dni = e.target.value.trim();
      if (dni) buscarDni(dni);
    }
  });
