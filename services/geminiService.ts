import { GoogleGenAI } from "@google/genai";
import { GameState, PlayerColor } from '../types';

let aiClient: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateCommentary = async (
  gameState: GameState, 
  lastAction: string
): Promise<string> => {
  if (!aiClient) return "Commentary unavailable (No API Key)";

  try {
    const prompt = `
      You are a high-energy, witty sports commentator for a high-stakes Ludo match called "Neon Ludo Bet".
      
      Current Game Status:
      - Current Turn: ${gameState.currentPlayer}
      - Last Action: ${lastAction}
      - Winning Player: ${gameState.winner || 'None yet'}
      
      Give me a SINGLE, punchy, exciting sentence reacting to the last action. 
      Be enthusiastic. Use emojis. If someone was captured/eaten, go wild.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "What a move!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Technical difficulties in the commentary booth!";
  }
};
