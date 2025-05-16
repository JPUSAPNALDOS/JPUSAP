document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("verificarBtn").onclick = verificarPlaca;
});

const sheetId = "1T8EncGlUe0X20Carupv8vRNhxYz_jGYJlj_s_5nITsQ";
const sheetName = "VERIFICACION";
const apiKey = "AIzaSyBbQqXlcuEkflDUVOQtXHCJN_HMiFQHhmE"; 

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

      for (let i = 1; i < filas.length; i++) {
        if (filas[i][0] && filas[i][0].toUpperCase() === placaIngresada) {
          estado = filas[i][1] ? filas[i][1].toUpperCase() : "SIN INFORMACIÓN";
          estadoCuenta = filas[i][2] ? filas[i][2].toUpperCase() : "SIN ESTADO DE CUENTA";
          break;
        }
      }

      resultadoDiv.innerHTML = `
        <span id="estadoSpan">🔍 Estado: ${estado}</span><br>
        <span id="estadoCuentaSpan">💰 Estado de Cuenta: ${estadoCuenta}</span>
      `;

      const estadoSpan = document.getElementById("estadoSpan");
      const estadoCuentaSpan = document.getElementById("estadoCuentaSpan");

      estadoSpan.style.color = estado === "APORTANTE" ? "green" : estado === "NO APORTANTE" ? "orange" : "red";

      if (estadoCuenta === "ESTABLE") {
        estadoCuentaSpan.style.color = "green";
      } else if (estadoCuenta === "RETRASO DE DEUDA") {
        estadoCuentaSpan.style.color = "red";
      } else {
        estadoCuentaSpan.style.color = "black";
      }
    })
    .catch(err => {
      console.error("Error:", err);
      resultadoDiv.textContent = `🚨 Error: ${err.message}`;
      resultadoDiv.style.color = "red";
    });
}
