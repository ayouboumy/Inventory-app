import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, ItemCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Analyze a new item name to suggest category and description
export const analyzeItemWithGemini = async (itemName: string): Promise<{ category: ItemCategory; subsection: string; description: string; suggestedMinStock: number }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this inventory item name: "${itemName}".
      Context: This is for a mosque or community center inventory tracking system.
      Categories available: "Sonorisation" (Sound equipment), "Quran Book" (Religious texts).
      
      Return a JSON object with:
      1. category: "Sonorisation", "Quran Book", or "Other".
      2. subsection: A specific concise type (e.g., "Microphones", "Cables", "Speakers", "Mushaf", "Education").
      3. description: A short, professional description.
      4. suggestedMinStock: Integer.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: [ItemCategory.SONORISATION, ItemCategory.QURAN_BOOK, ItemCategory.OTHER] },
            subsection: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedMinStock: { type: Type.INTEGER }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      category: ItemCategory.OTHER,
      subsection: "General",
      description: "Manual entry required",
      suggestedMinStock: 5
    };
  }
};

// Chat with inventory data
export const chatWithInventory = async (query: string, inventory: InventoryItem[]): Promise<string> => {
  try {
    const inventoryContext = JSON.stringify(inventory.map(item => ({
      name: item.name,
      category: item.category,
      subsection: item.subsection,
      qty: item.quantity,
      location: item.location,
      lowStock: item.quantity < item.minStockLevel
    })));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User Query: "${query}"
      
      Current Inventory Data:
      ${inventoryContext}
      
      System Instruction:
      You are the Inventory Assistant for "Noor Inventory". 
      Answer strictly based on data.
      If asked about specific subsections (e.g., "How many mics?"), filter by that subsection context.
      `,
    });

    return response.text || "I couldn't process that request based on the current data.";
  } catch (error) {
    console.error("Inventory chat failed:", error);
    return "Sorry, I'm having trouble connecting to the AI service right now.";
  }
};
