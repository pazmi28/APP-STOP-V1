// Categorías del juego (para usar en toda la app)
export const CATEGORIES = [
  { id: "name", name: "Nombre", icon: "👤" },
  { id: "city", name: "Ciudad/Pais", icon: "🌍" },
  { id: "object", name: "Objeto", icon: "📦" },
  { id: "color", name: "Color", icon: "🎨" },
  { id: "fruit", name: "Fruta/Verdura", icon: "🍎" },
  { id: "animal", name: "Animal", icon: "🐘" },
  { id: "adjective", name: "Adjetivo", icon: "✨" },
  { id: "verb", name: "Verbo", icon: "⚡" },
];

// Estados de la sala
export const ROOM_STATUS = {
  WAITING: "esperando",
  PLAYING: "jugando",
  FINISHED: "terminada",
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  REQUIRED: "Este campo es obligatorio",
  INVALID_EMAIL: "Email inválido",
  PASSWORD_MATCH: "Las contraseñas no coinciden",
  PASSWORD_LENGTH: "La contraseña debe tener al menos 6 caracteres",
};
