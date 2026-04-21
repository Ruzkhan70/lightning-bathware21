import { toast } from "sonner";

export const ICON_PROMPTS: Record<string, { prompt: string; color: string }> = {
  "Lighting": { prompt: "A minimalist flat white lightbulb icon centered on solid #EAB308 (yellow-500) background, clean simple design, no gradients", color: "#EAB308" },
  "Bathroom Fittings": { prompt: "A minimalist flat white bathtub icon centered on solid #3B82F6 (blue-500) background, clean simple design, no gradients", color: "#3B82F6" },
  "Shower Systems": { prompt: "A minimalist flat white shower head with water drops icon centered on solid #3B82F6 (blue-500) background, clean simple design, no gradients", color: "#3B82F6" },
  "Taps & Mixers": { prompt: "A minimalist flat white faucet/tap icon centered on solid #3B82F6 (blue-500) background, clean simple design, no gradients", color: "#3B82F6" },
  "Valves & Cartridges": { prompt: "A minimalist flat white valve wheel icon centered on solid #22C55E (green-500) background, clean simple design, no gradients", color: "#22C55E" },
  "Plumbing": { prompt: "A minimalist flat white wrench icon centered on solid #22C55E (green-500) background, clean simple design, no gradients", color: "#22C55E" },
  "Drainage & Waste Systems": { prompt: "A minimalist flat white drain pipe icon centered on solid #6B7280 (gray-500) background, clean simple design, no gradients", color: "#6B7280" },
  "Electrical Hardware": { prompt: "A minimalist flat white lightning bolt icon centered on solid #F97316 (orange-500) background, clean simple design, no gradients", color: "#F97316" },
  "Gas & Utility": { prompt: "A minimalist flat white flame/gas icon centered on solid #F97316 (orange-500) background, clean simple design, no gradients", color: "#F97316" },
  "Construction Tools": { prompt: "A minimalist flat white hard hat icon centered on solid #EF4444 (red-500) background, clean simple design, no gradients", color: "#EF4444" },
  "Appliance Accessories": { prompt: "A minimalist flat white plug/electrical icon centered on solid #A855F7 (purple-500) background, clean simple design, no gradients", color: "#A855F7" },
  "Painting & Finishing Tools": { prompt: "A minimalist flat white paint brush icon centered on solid #EC4899 (pink-500) background, clean simple design, no gradients", color: "#EC4899" },
};

export const BANNER_PROMPTS: Record<string, { prompt: string; color: string }> = {
  "Lighting": { prompt: "A wide hero showroom banner displaying elegant modern ceiling lights and pendant lamps, warm ambient golden lighting, professional product photography, clean white background, no text, no people", color: "#EAB308" },
  "Bathroom Fittings": { prompt: "A luxurious spa bathroom with elegant bath fixtures and polished chrome taps, marble tiles, soft golden lighting, professional product photography, no text, no people", color: "#3B82F6" },
  "Shower Systems": { prompt: "A modern rainfall shower system with sleek chrome finish, clean glass enclosure, water droplets, professional product photography, no text", color: "#3B82F6" },
  "Taps & Mixers": { prompt: "A collection of elegant bathroom and kitchen faucets with chrome finish, professional product photography, clean background, no text", color: "#3B82F6" },
  "Valves & Cartridges": { prompt: "Industrial brass valves and cartridges, professional product photography, clean gray background, no text", color: "#22C55E" },
  "Plumbing": { prompt: "Professional plumbing supplies including pipes and fittings, clean studio lighting, no text", color: "#22C55E" },
  "Drainage & Waste Systems": { prompt: "Clean drainage pipes and waste system components, professional product photography, no text", color: "#6B7280" },
  "Electrical Hardware": { prompt: "Electrical switches, outlets and wiring components, professional product photography, clean background, no text", color: "#F97316" },
  "Gas & Utility": { prompt: "Gas cylinders and utility components for home use, professional product photography, no text", color: "#F97316" },
  "Construction Tools": { prompt: "Professional power tools and construction equipment on workbench, natural lighting, no text", color: "#EF4444" },
  "Appliance Accessories": { prompt: "Home appliance accessories and parts, professional product photography, clean background, no text", color: "#A855F7" },
  "Painting & Finishing Tools": { prompt: "Quality paint brushes and finishing tools, professional product photography, no text", color: "#EC4899" },
};

export const DEFAULT_COLOR = "#3B82F6";

const MODELS_TO_TRY = [
  "gemini-2.0-flash-preview-0520",
  "gemini-2.5-flash-preview-05-20",
  "imagen-3.0-generate-002"
];

export async function generateCategoryIcon(
  categoryName: string,
  apiKey: string
): Promise<string> {
  const promptConfig = ICON_PROMPTS[categoryName] || {
    prompt: `A minimalist flat white icon representing ${categoryName} centered on solid #3B82F6 (blue-500) background, clean simple design, no gradients`,
    color: DEFAULT_COLOR
  };

  const prompt = `${promptConfig.prompt}. Generate as a simple square PNG icon 512x512 pixels, white icon centered on solid colored background, flat minimalist style, no gradients or shadows.`;

  for (const model of MODELS_TO_TRY) {
    try {
      const result = await tryGenerateWithModel(model, prompt, apiKey);
      if (result) return result;
    } catch (error) {
      console.warn(`Model ${model} failed:`, error);
    }
  }

  throw new Error("All models failed - use text prompt instead");
}

async function tryGenerateWithModel(model: string, prompt: string, apiKey: string): Promise<string | null> {
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      topP: 1,
      topK: 1,
      maxOutputTokens: 8192,
      responseModalities: ["IMAGE"]
    },
    systemInstruction: { parts: [{ text: "You are an image generation model. Generate images as requested." }] }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error with model ${model}:`, errorText);
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    console.error(`Model ${model} error:`, result.error.message);
    throw new Error(result.error.message);
  }

  if (result.candidates?.[0]?.content?.parts) {
    const part = result.candidates[0].content.parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data);
    if (part?.inlineData?.data) {
      const imageData = part.inlineData.data;
      const imageBlob = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
      const blob = new Blob([imageBlob], { type: part.inlineData.mimeType || "image/png" });
      return await uploadToImgBB(blob);
    }
  }

  return null;
}

async function uploadToImgBB(blob: Blob): Promise<string> {
  const formData = new FormData();
  const fileName = `icon_${Date.now()}.png`;
  const file = new File([blob], fileName, { type: "image/png" });
  formData.append("image", file);
  
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("Image upload API key not configured");
  }
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error("Failed to upload icon to CDN");
  }
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || "Upload failed");
  }
  
  return data.data.url;
}

export function getCategoryColor(categoryName: string): string {
  return ICON_PROMPTS[categoryName]?.color || DEFAULT_COLOR;
}

export async function generateBannerImage(
  categoryName: string,
  apiKey: string
): Promise<string> {
  const promptConfig = BANNER_PROMPTS[categoryName] || {
    prompt: `A wide hero banner representing ${categoryName}, professional product photography style, clean background, no text, no people`,
    color: DEFAULT_COLOR
  };

  const prompt = `${promptConfig.prompt}. Generate as a wide rectangular PNG banner image 1920x800 pixels, professional product photography, no gradients or text.`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.9,
      topP: 1,
      topK: 1,
      maxOutputTokens: 8192,
      responseModalities: ["IMAGE"]
    },
    systemInstruction: {
      parts: [{ text: "You are an image generation model. Generate images as requested." }]
    }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-0520:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Failed to generate banner: ${response.status}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates[0]?.content?.parts) {
      const part = result.candidates[0].content.parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data);
      
      if (part?.inlineData?.data) {
        const imageData = part.inlineData.data;
        const imageBlob = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
        
        const blob = new Blob([imageBlob], { type: part.inlineData.mimeType || "image/png" });
        return await uploadToImgBB(blob);
      }
    }

    if (result.error) {
      console.error("Gemini API error:", result.error.message);
      throw new Error(result.error.message);
    }

    throw new Error("No image generated from Gemini");
  } catch (error) {
    console.error("Error generating banner image:", error);
    throw error;
  }
}

export function getTextPrompt(categoryName: string, type: "icon" | "banner"): string {
  if (type === "icon") {
    const promptConfig = ICON_PROMPTS[categoryName] || {
      prompt: `A minimalist flat white icon representing ${categoryName} centered on solid ${DEFAULT_COLOR} background, clean simple design`,
      color: DEFAULT_COLOR
    };
    return `Icon Prompt for ${categoryName}:\n\n${promptConfig.prompt}\n\nSpecifications: 512x512 pixels, white icon on colored background, PNG format, flat minimalist style, no gradients, no shadows.`;
  } else {
    const promptConfig = BANNER_PROMPTS[categoryName] || {
      prompt: `Professional product photography for ${categoryName}`,
      color: DEFAULT_COLOR
    };
    return `Banner Prompt for ${categoryName}:\n\n${promptConfig.prompt}\n\nSpecifications: 1920x800 pixels, wide rectangular banner, professional product photography, clean background, no text, no people, PNG format.`;
  }
}