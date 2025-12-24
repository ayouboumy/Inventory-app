import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, ItemCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Analyze a new item name to suggest category and description
export const analyzeItemWithGemini = async (itemName: string): Promise<{ category: ItemCategory; subsection: string; description: string; suggestedMinStock: number }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `قم بتحليل اسم عنصر المخزون هذا: "${itemName}".
      
      أعد كائن JSON يحتوي على:
      1. category: "Sonorisation" أو "Quran Book" أو "Other".
      2. subsection: نوع محدد ومختصر باللغة العربية (مثال: "ميكروفونات"، "كابلات"، "سماعات"، "مصاحف"، "كتب تعليمية").
      3. description: وصف قصير واحترافي باللغة العربية.
      4. suggestedMinStock: عدد صحيح (Integer).
      `,
      config: {
        systemInstruction: `السياق: هذا نظام تتبع مخزون لمسجد أو مركز مجتمعي.
      الفئات المتاحة: "Sonorisation" (معدات صوتية)، "Quran Book" (نصوص دينية ومصاحف).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: [ItemCategory.SONORISATION, ItemCategory.QURAN_BOOK, ItemCategory.OTHER] },
            subsection: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedMinStock: { type: Type.INTEGER }
          },
          propertyOrdering: ["category", "subsection", "description", "suggestedMinStock"]
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
      subsection: "عام",
      description: "إدخال يدوي مطلوب",
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
      contents: `سؤال المستخدم: "${query}"
      
      بيانات المخزون الحالية:
      ${inventoryContext}
      `,
      config: {
        systemInstruction: `أنت المساعد الذكي لـ "منصة ضبط التوزيع". 
      أجب باللغة العربية بدقة بناءً على البيانات المقدمة.
      إذا سُئلت عن أقسام محددة (مثل "كم عدد الميكروفونات؟")، قم بالتتصفية بناءً على سياق القسم الفرعي.`
      }
    });

    return response.text || "لم أتمكن من معالجة الطلب بناءً على البيانات الحالية.";
  } catch (error) {
    console.error("Inventory chat failed:", error);
    return "عذراً، أواجه صعوبة في الاتصال بخدمة الذكاء الاصطناعي حالياً.";
  }
};