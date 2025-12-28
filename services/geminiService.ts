import { GoogleGenAI, Type } from "@google/genai";
import { CustomerProfile, CrystalAnalysis } from '../types';
import { CRYSTAL_KNOWLEDGE_BASE } from './crystalDatabase';
import { getProductDetails } from './productDatabase';

const STRATEGY_A_STRICT_BAZI = `
【模式 A：精確八字排盤 (Time Known)】
你必須採取「嚴格五行平衡」策略。

1. **排盤與計算**：
   - 嚴格計算年、月、日、時四柱。
   - 精確計算身強身弱、通根透干、月令權重。

2. **決定喜用神 (Lucky Element)**：
   - 根據「扶抑（強者剋洩、弱者生扶）」、「調候（寒暖燥濕）」、「通關」原則。
   - **重要指令**：在此模式下，【忽略用戶的願望】。
   - 即使願望是求財，如果命盤「身弱不勝財」，喜用神必須是【印/比】（生扶），而不是【財】。
   - 喜用神必須是為了讓命盤達到「中和」狀態。

3. **水晶選擇**：
   - **嚴格限制**：選出的水晶必須在資料庫中對應到你的【喜用神】五行。
   - 例如：若喜用神為【木】，只能選 (木) 屬性水晶，不管用戶願望是什麼。

4. **分析撰寫**：
   - 強調你是根據「命盤五行平衡」來挑選，是為了補足先天命理的缺失。
`;

const STRATEGY_B_WISH_ORIENTED = `
【模式 B：主要願望導向 (Time Unsure)】
由於用戶不確定出生時辰，四柱缺一，精確計算身強身弱容易失準。
你必須採取「願望顯化」策略，並嚴格遵守願望分級：

1. **排盤限制**：
   - 僅排出年、月、日三柱供參考。時柱請標記為 "吉時" 或 "未知"。
   - 五行分數計算僅基於前三柱（權重調整：月令仍最重）。

2. **決定水晶 (Crystal Selection)**：
   - **最高準則**：你的設計與水晶選擇必須**100% 基於【主要願望 (Core Focus)】**。
   - **次要願望處理 (Auxiliary Rules)**：
      - 【次要願望】僅作為參考背景，**絕不能**影響水晶的主體選擇。
      - 如果次要願望需要的水晶與主要願望衝突，**直接忽略次要願望**。
      - 不要為了滿足次要願望而混雜不相關的五行，這會導致能量發散。
   - 從【水晶資料庫】中，找出最能解決【主要願望】的水晶。
   - 例如：主要願望是「招財」，即使次要願望是「愛情」，也必須優先選擇 黃水晶、鈦晶、金髮晶。

3. **反推喜用神 (Lucky Element)**：
   - 將你為【主要願望】選出的水晶所屬的五行，設定為本次分析的【喜用神】。
   
4. **分析撰寫**：
   - 強調你是為了達成用戶的「主要願望」而凝聚能量。
   - 內文主要解釋如何透過水晶達成【主要願望】。
   - 對於次要願望，僅需一句話帶過或不提，強調設計核心是集中火力在主要願望上。
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const primaryWishes = profile.wishes ? profile.wishes.slice(0, 3) : [];
  const strategyInstruction = profile.isTimeUnsure ? STRATEGY_B_WISH_ORIENTED : STRATEGY_A_STRICT_BAZI;

const promptText = `
    你是一位精通傳統八字命理（BaZi）與五行能量調理的大師。

    【輸入資料】
    出生日期: ${profile.birthDate}
    出生時間: ${timeInfo}
    性別: ${profile.gender}
    (姓名: ${profile.name} - 僅供稱呼，**嚴禁**影響八字排盤)
    
    【主要願望 (Core Focus) - 設計核心】: ${primaryWishesStr} (請以此為主進行設計)
    【次要願望 (Auxiliary) - 僅供參考】: ${secondaryWishesStr}
    （系統規則：不得以次要願望作為選擇水晶的依據，只能在 Reasoning 中簡短提及背景。）

    ${strategyInstruction}

    【通用八字排盤規則 (Step-by-Step)】
    1. **年柱**：依據農曆立春分界。
    2. **月柱**：**必須使用「五虎遁年起月法」**。務必精確對照「二十四節氣」判定月份。
    3. **日柱**：請依據萬年曆推算干支。
    4. **時柱**：若時間已知，使用「五鼠遁日起時法」；若未知，不計算干支。
    
    【通用輸出規則】
    - **五行分數**：無論哪種模式，請輸出當前命盤(3柱或4柱)的五行能量分佈 (0-100)。
    - **分析一致性**：Reasoning 的內容必須解釋「為何選這個喜用神/水晶」。
       - 模式 A 解釋：因為命盤缺 X，所以補 X。
       - 模式 B 解釋：因為您的【主要願望】是 Y，此水晶能集中能量達成 Y。
    - **嚴禁**在 Reasoning 中提及具體水晶名稱 (保留商業機密)。

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

/**
 * 圖片生成功能已停用
 * 改為從商品資料庫直接取得圖片，若無則返回空字串
 */
export const generateBraceletImage = async (analysis: CrystalAnalysis, profile: CustomerProfile): Promise<string> => {
  console.log("[圖片生成] 功能已停用，從商品資料庫取得圖片");
  
  // 檢查分析結果是否有效
  if (!analysis || !analysis.suggestedCrystals || analysis.suggestedCrystals.length === 0) {
    console.warn("[圖片生成] 無效的分析結果");
    return "";
  }

  const mainCrystal = analysis.suggestedCrystals[0];
  
  // 從商品資料庫取得圖片
  const productInfo = getProductDetails(mainCrystal);

  if (productInfo && productInfo.imageUrl) {
    console.log(`[商品資料庫] 找到 ${mainCrystal} 的圖片`);
    return productInfo.imageUrl;
  }

  console.warn(`[商品資料庫] 未找到 ${mainCrystal} 的圖片，返回空字串`);
  return "";

  /* 
  ===== 以下是原本的 AI 圖片生成代碼（已停用，保留以便未來恢復） =====
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const crystalStr = analysis.suggestedCrystals.join(", ");

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
  */
};
