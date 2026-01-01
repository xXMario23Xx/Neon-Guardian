
import { GoogleGenAI } from "@google/genai";
import { GameState, TowerInstance } from "./types";
import { TOWERS } from "./constants";

// Initialize GoogleGenAI with the API key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LOCAL_ADVICE = [
  "¡Construye más torres de área para grupos grandes!",
  "El Mago Arcano es letal contra enemigos lentos.",
  "No olvides mejorar el rango de tus arqueras.",
  "¡El Golem de Hielo frena a los jefes!",
  "Ahorra créditos para las olas de nivel 10.",
  "¡Vende torres poco eficientes para recuperar fondos!",
  "El Francotirador es clave contra el Aniquilador."
];

export async function getTacticalAdvice(gameState: GameState, towers: TowerInstance[]) {
  // Check if user is offline
  if (!navigator.onLine) {
    return LOCAL_ADVICE[Math.floor(Math.random() * LOCAL_ADVICE.length)];
  }

  try {
    const towerSummary = towers.map(t => TOWERS[t.type].name).join(", ");
    const prompt = `Actúa como un comandante experto en Tower Defense. 
    Estado actual del juego:
    - Ola: ${gameState.wave}
    - Dinero: ${gameState.money}
    - Vidas: ${gameState.lives}
    - Torres construidas: ${towerSummary || "Ninguna"}
    
    Da un consejo táctico muy breve (máximo 15 palabras) en español para ayudar al jugador.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || LOCAL_ADVICE[0];
  } catch (error) {
    console.error("Gemini advice error:", error);
    return LOCAL_ADVICE[Math.floor(Math.random() * LOCAL_ADVICE.length)];
  }
}
