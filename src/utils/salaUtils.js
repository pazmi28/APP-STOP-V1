// Genera un código aleatorio de 6 caracteres (ej: AB12CD)
export const generarCodigoSala = () => {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
};

// Valida que el código tenga el formato correcto
export const validarCodigoSala = (codigo) => {
  return /^[A-Z0-9]{6}$/.test(codigo);
};

// Obtener nombre de usuario desde email
export const getNombreUsuario = (email) => {
  return email ? email.split("@")[0] : "Jugador";
};
