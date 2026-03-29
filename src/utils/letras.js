// Lista de letras disponibles (excluimos W, X, Y, Z por ser poco comunes en español)
export const LETRAS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
];

// Historial de letras recientes para evitar repeticiones (últimas 5)
const historialLetras = [];
const MAX_HISTORIAL = 5;

export const getLetraAleatoria = () => {
  // Filtrar las letras que estuvieron en las últimas MAX_HISTORIAL rondas
  const disponibles = LETRAS.filter((l) => !historialLetras.includes(l));
  // Si todas estuvieron (partida muy larga), usar todas igualmente
  const pool = disponibles.length > 0 ? disponibles : LETRAS;

  const letra = pool[Math.floor(Math.random() * pool.length)];

  // Actualizar historial
  historialLetras.push(letra);
  if (historialLetras.length > MAX_HISTORIAL) {
    historialLetras.shift();
  }

  return letra;
};

// Normaliza una palabra: minúsculas + sin tildes + sin espacios extra
// Así "Murciélago" === "murcielago" === "MURCIÉLAGO"
export const normalizarPalabra = (str) => {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD") // descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, ""); // elimina los diacríticos
};

// Categorías del juego
export const CATEGORIAS = [
  { id: "nombre", nombre: "Nombre", icono: "👤", placeholder: "Ej: Bruno" },
  {
    id: "ciudad",
    nombre: "Ciudad/País",
    icono: "🌍",
    placeholder: "Ej: Brasil",
  },
  { id: "objeto", nombre: "Objeto", icono: "📦", placeholder: "Ej: Bota" },
  { id: "color", nombre: "Color", icono: "🎨", placeholder: "Ej: Blanco" },
  {
    id: "fruta",
    nombre: "Fruta/Verdura",
    icono: "🍎",
    placeholder: "Ej: Brócoli",
  },
  { id: "animal", nombre: "Animal", icono: "🐘", placeholder: "Ej: Burro" },
  {
    id: "adjetivo",
    nombre: "Adjetivo",
    icono: "✨",
    placeholder: "Ej: Bonito",
  },
  { id: "verbo", nombre: "Verbo", icono: "⚡", placeholder: "Ej: Bailar" },
];

export const TIEMPO_RONDA = 60;
