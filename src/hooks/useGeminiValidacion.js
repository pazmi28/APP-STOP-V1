const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const buildPrompt = (letra, respuestas, categorias) => {
  const lineas = respuestas.map((r) => {
    const cat = categorias.find((c) => c.id === r.categoria);
    return `  { "cat_id": "${r.categoria}", "categoria": "${
      cat?.nombre || r.categoria
    }", "palabra": "${r.palabra}" }`;
  });

  return `Eres un árbitro del juego Stop/Tutti Frutti en español castellano.
La letra de la ronda es: "${letra}"

Valida cada palabra con estas reglas:
1. DEBE empezar por la letra "${letra}" (ignora artículos: el/la/un/una/los/las).
2. DEBE existir en el diccionario español (RAE). Si es inventada o no existe → inválida.
3. DEBE ser válida para su categoría.

Palabras:
[
${lineas.join(",\n")}
]

Responde ÚNICAMENTE con JSON puro sin markdown:
{"resultados":[{"cat_id":"id","palabra":"palabra","valida":true,"motivo":""},{"cat_id":"id","palabra":"otra","valida":false,"motivo":"razón breve"}]}`;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const validarConGemini = async (
  letra,
  respuestas,
  categorias,
  intentos = 0
) => {
  const apiKey = process.env.REACT_APP_GEMINI_KEY;
  if (!apiKey) {
    console.warn("⚠️ REACT_APP_GEMINI_KEY no configurada");
    return null;
  }

  const conPalabra = respuestas.filter((r) => r.palabra?.trim());
  if (!conPalabra.length) return null;

  console.log(
    `🤖 Gemini validando ${
      conPalabra.length
    } palabras (letra: ${letra}, intento: ${intentos + 1})`
  );

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: buildPrompt(letra, conPalabra, categorias) }] },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 1024 },
      }),
    });

    if (response.status === 429) {
      if (intentos < 2) {
        const espera = (intentos + 1) * 5000;
        console.warn(`⏳ Rate limit, reintentando en ${espera / 1000}s...`);
        await sleep(espera);
        return validarConGemini(letra, respuestas, categorias, intentos + 1);
      }
      console.error("❌ Rate limit agotado tras reintentos");
      return null;
    }

    if (!response.ok) {
      console.error("Error API:", await response.json());
      return null;
    }

    const data = await response.json();
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const limpio = texto
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    console.log("🤖 Respuesta Gemini:", limpio);

    const parsed = JSON.parse(limpio);
    // Normalizar: soporta tanto "cat_id" como "categoria"
    const resultados = (parsed?.resultados || []).map((r) => ({
      ...r,
      categoria: r.cat_id || r.categoria,
    }));
    return resultados;
  } catch (err) {
    console.error("Error Gemini:", err);
    return null;
  }
};
