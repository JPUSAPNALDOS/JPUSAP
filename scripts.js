const apiKey = "AIzaSyBbQqXlcuEkflDUVOQtXHCJN_HMiFQHhmE"; // <- Tu API Key real
const sheetId = "1T8EncGlUe0X20Carupv8vRNhxYz_jGYJlj_s_5nITsQ";
const sheetName = "VERIFICACION";

function verificarPlaca() {
  const placaIngresada = document.getElementById("placaInput").value.trim().toUpperCase();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const filas = data.values;
      let encontrado = false;
      let estado = "DESCONOCIDO";

      for (let i = 1; i < filas.length; i++) {
        if (filas[i][0].toUpperCase() === placaIngresada) {
          estado = filas[i][1].toUpperCase();
          encontrado = true;
          break;
        }
      }

      document.getElementById("resultado").textContent = estado;
      document.getElementById("resultado").style.color = 
        estado === "APORTANTE" ? "green" : 
        estado === "NO APORTANTE" ? "orange" : "red";
    })
    .catch(err => {
      console.error("Error al consultar la hoja:", err);
      document.getElementById("resultado").textContent = "Error al verificar";
      document.getElementById("resultado").style.color = "red";
    });
}

// Se agrega el evento 'keydown' para escuchar la tecla ENTER
document.getElementById("placaInput").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();  // Evita que el formulario se envíe
    verificarPlaca();        // Llama a la función para verificar la placa
  }
});

// Se puede quitar el 'onsubmit' en el formulario para evitar conflictos con el evento ENTER
document.getElementById("formulario").addEventListener("submit", function(e) {
  e.preventDefault();  // Evita la recarga de la página
  verificarPlaca();    // Llama a la función para verificar la placa
});
