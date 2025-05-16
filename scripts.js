const sheetId = "1T8EncGlUe0X20Carupv8vRNhxYz_jGYJlj_s_5nITsQ"; // Verifica que este ID sea el correcto
const sheetName = "VERIFICACION";
const apiKey = "AIzaSyBbQqXlcuEkflDUVOQtXHCJN_HMiFQHhmE"; // Asegúrate de que sea una clave válida

// Función para verificar por placa
function verificarPlaca() {
  const placaInput = document.getElementById("placaInput");
  const resultadoDiv = document.getElementById("resultado");
  let placaIngresada = placaInput.value.trim().toUpperCase();
  
  if (placaIngresada === "") {
    resultadoDiv.textContent = "⚠️ Ingresa una placa válida.";
    resultadoDiv.style.color = "red";
    return;
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`;
  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Error en la API: ${res.status} - ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      if (!data.values || data.values.length === 0) {
        throw new Error("No hay datos disponibles en la hoja.");
      }
      
      const filas = data.values;
      let estado = "NO ENCONTRADO";
      let estadoCuenta = "SIN DATOS";
      
      // Variables para los campos de deuda
      let mz = "N/A";
      let lote = "N/A";
      let etapa = "N/A";
      let mesesAdeudados = "0";
      
      // Recorremos las filas (se asume que la primera fila es el encabezado)
      for (let i = 1; i < filas.length; i++) {
        if (filas[i][0] && filas[i][0].toUpperCase() === placaIngresada) {
          estado = filas[i][1] ? filas[i][1].toUpperCase() : "SIN INFORMACIÓN";
          estadoCuenta = filas[i][2] ? filas[i][2].toUpperCase() : "SIN ESTADO DE CUENTA";
          mz = (filas[i].length > 3 && filas[i][3]) ? filas[i][3] : "N/A";
          lote = (filas[i].length > 4 && filas[i][4]) ? filas[i][4] : "N/A";
          etapa = (filas[i].length > 5 && filas[i][5]) ? filas[i][5] : "N/A";
          mesesAdeudados = (filas[i].length > 6 && filas[i][6]) ? filas[i][6] : "0";
          break;
        }
      }
      
      // Actualiza la pestaña de Verificación (resultado original)
      resultadoDiv.innerHTML = `
        <span id="estadoSpan">🔍 Estado: ${estado}</span><br>
        <span id="estadoCuentaSpan">💰 Estado de Cuenta: ${estadoCuenta}</span>
      `;
      
      const estadoSpan = document.getElementById("estadoSpan");
      const estadoCuentaSpan = document.getElementById("estadoCuentaSpan");
      estadoSpan.style.color = (estado === "APORTANTE") ? "green" : (estado === "NO APORTANTE") ? "orange" : "red";
      if (estadoCuenta === "ESTABLE") {
        estadoCuentaSpan.style.color = "green";
      } else if (estadoCuenta === "RETRASO DE DEUDA") {
        estadoCuentaSpan.style.color = "red";
      } else {
        estadoCuentaSpan.style.color = "black";
      }
      
      // Actualiza los inputs en la pestaña "Estado de Deuda" con los valores obtenidos
      document.getElementById("mz").value = mz;
      document.getElementById("lote").value = lote;
      document.getElementById("etapa").value = etapa;
      document.getElementById("mesesAdeudados").value = mesesAdeudados;
    })
    .catch(err => {
      console.error("Error:", err);
      resultadoDiv.textContent = `🚨 Error: ${err.message}`;
      resultadoDiv.style.color = "red";
    });
}

// Función independiente para verificar la deuda usando los campos Mz, Lote y Etapa
function verificarDeuda() {
  const mzInputValue = document.getElementById("mz").value.trim().toUpperCase();
  const loteInputValue = document.getElementById("lote").value.trim().toUpperCase();
  const etapaInputValue = document.getElementById("etapa").value.trim().toUpperCase();
  const mesesInput = document.getElementById("mesesAdeudados");
  
  if (mzInputValue === "" || loteInputValue === "" || etapaInputValue === "") {
    mesesInput.value = "⚠️ Rellene Mz, Lote y Etapa.";
    return;
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`;
  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Error en la API: ${res.status} - ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      if (!data.values || data.values.length === 0) {
        throw new Error("No hay datos disponibles en la hoja.");
      }
      
      const filas = data.values;
      let mesesAdeudadosResult = "NO ENCONTRADO";
      
      for (let i = 1; i < filas.length; i++) {
        if (
          filas[i].length >= 7 &&
          filas[i][3] && filas[i][3].toUpperCase() === mzInputValue &&
          filas[i][4] && filas[i][4].toUpperCase() === loteInputValue &&
          filas[i][5] && filas[i][5].toUpperCase() === etapaInputValue
        ) {
          mesesAdeudadosResult = filas[i][6] ? filas[i][6] : "0";
          break;
        }
      }
      
      mesesInput.value = mesesAdeudadosResult;
    })
    .catch(err => {
      console.error("Error:", err);
      mesesInput.value = `🚨 Error: ${err.message}`;
    });
}

// ---
// Agregar soporte para el botón ENTER

// Para la verificación por placa
document.getElementById("placaInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    verificarPlaca();
  }
});

// Para la pestaña de Estado de Deuda: si se pulsa Enter en cualquiera de los inputs de Mz, Lote o Etapa, se activa la verificación de deuda.
["mz", "lote", "etapa"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      verificarDeuda();
    }
  });
});
