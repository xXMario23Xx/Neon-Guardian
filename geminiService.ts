
import { GoogleGenAI } from "@google/genai";
import { GameState, TowerInstance } from "./types";
import { TOWERS } from "./constants";

const getApiKey = () => {
  try {
    // Vite usa import.meta.env para las variables de entorno
    return (import.meta as any).env?.VITE_API_KEY || "";
  } catch (e) {
    return "";
  }
};

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
  const apiKey = getApiKey();
  
  if (!apiKey || !navigator.onLine) {
    return LOCAL_ADVICE[Math.floor(Math.random() * LOCAL_ADVICE.length)];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const towerSummary = towers.map(t => TOWERS[t.type].name).join(", ");
    const prompt = `Actúa como un comandante experto en Tower Defense. 
    Ola: ${gameState.wave}, Dinero: ${gameState.money}, Vidas: ${gameState.lives}. 
    Torres: ${towerSummary || "Ninguna"}.
    Da un consejo táctico de máximo 10 palabras en español.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || LOCAL_ADVICE[0];
  } catch (error) {
    return LOCAL_ADVICE[Math.floor(Math.random() * LOCAL_ADVICE.length)];
  }
}
