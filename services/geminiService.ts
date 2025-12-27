import { GoogleGenAI, Type } from "@google/genai";
import { CustomerProfile, CrystalAnalysis } from '../types';
import { CRYSTAL_KNOWLEDGE_BASE } from './crystalDatabase';
import { getProductDetails } from './productDatabase';

const STRATEGY_A_STRICT_BAZI = `
【模式 A：精確八字排盤 (時辰已知)】
你必須採取「嚴格五行平衡」策略。
1. **排盤與計算**：精確計算年、月、日、時四柱，判定身強身弱、月令權重。
2. **決定喜用神**：根據扶抑、調候、通關原則。在此模式下，【忽略用戶願望】，以平衡命盤為最高準則。
3. **水晶選擇**：選出的水晶必須在資料庫中對應喜用神五行。
`;

const STRATEGY_B_WISH_ORIENTED = `
【模式 B：願望顯化導向 (時辰不詳)】
由於時辰不確定，精確計算易失準，改採「願望顯化」策略。
1. **排盤限制**：僅參考年、月、日三柱。
2. **決定水晶**：100% 基於用戶的【主要願望】。從資料庫中找出最能解決該願望的水晶。
3. **反推喜用神**：將為願望選出的水晶五行設定為本次的喜用神。
`;

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    zodiacSign: { type: Type.STRING, description: "西方星座 (例如: 牡羊座)" },
    element: { type: Type.STRING, description: "西方四大元素 (火、土、風、水)" },
    bazi: {
      type: Type.OBJECT,
      properties: {
        year: { type: Type.STRING },
        month: { type: Type.STRING },
        day: { type: Type.STRING },
        time: { type: Type.STRING }
      },
      required: ["year", "month", "day", "time"]
    },
    fiveElements: {
      type: Type.OBJECT,
      properties: {
        gold: { type: Type.NUMBER },
        wood: { type: Type.NUMBER },
        water: { type: Type.NUMBER },
        fire: { type: Type.NUMBER },
        earth: { type: Type.NUMBER }
      },
      required: ["gold", "wood", "water", "fire", "earth"]
    },
    luckyElement: { type: Type.STRING },
    suggestedCrystals: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    reasoning: { type: Type.STRING },
    visualDescription: { type: Type.STRING, description: "手鍊外觀的詩意描述" },
    colorPalette: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["zodiacSign", "element", "bazi", "fiveElements", "luckyElement", "suggestedCrystals", "reasoning", "visualDescription", "colorPalette"]
};

export const analyzeCustomerProfile = async (profile: CustomerProfile): Promise<CrystalAnalysis> => {
  // Use Vite's import.meta.env for environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const primaryWishes = profile.wishes ? profile.wishes.slice(0, 3) : [];
  const strategyInstruction = profile.isTimeUnsure ? STRATEGY_B_WISH_ORIENTED : STRATEGY_A_STRICT_BAZI;

  const promptText = `
    你是一位精通八字命理與水晶能量的大師。
    【用戶資料】
    生日: ${profile.birthDate} 
    時間: ${profile.isTimeUnsure ? "不確定" : profile.birthTime}
    性別: ${profile.gender}
    主要願望: ${primaryWishes.map(w => w.type).join(', ')}

    ${strategyInstruction}

    【水晶資料庫】:
    ${CRYSTAL_KNOWLEDGE_BASE}

    請輸出繁體中文 JSON。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });

    const analysis = JSON.parse(response.text || '{}') as CrystalAnalysis;
    return analysis;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("分析失敗，請檢查網路連線。");
  }
};

export const generateBraceletImage = async (analysis: CrystalAnalysis, profile: CustomerProfile): Promise<string> => {
  // Use Vite's import.meta.env for environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const crystalStr = analysis.suggestedCrystals.join(", ");
  const mainCrystal = analysis.suggestedCrystals[0];
  const productInfo = getProductDetails(mainCrystal);

  if (productInfo && productInfo.imageUrl) return productInfo.imageUrl;

  const promptToUse = productInfo?.fixedPrompt || `
    Macro product photography of a high-end crystal bracelet.
    Subject: A single strand of genuine natural ${crystalStr} beads.
    Aesthetic: ${analysis.visualDescription}.
    Lighting: Soft cinematic studio lighting, elegant caustics and refractions through the semi-transparent beads.
    Background: Dark, moody, high-end boutique style with subtle bokeh.
    Details: 8k resolution, photorealistic, premium 14k gold spacers, visible natural inclusions within the stones.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: promptToUse,
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Image data empty");
  } catch (error) {
    console.error("Image Gen Error:", error);
    return ""; 
  }
};
