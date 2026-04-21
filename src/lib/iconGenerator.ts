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

export const DEFAULT_COLOR = "#3B82F6";

export async function generateCategoryIcon(
  categoryName: string,
  apiKey: string
): Promise<string> {
  const promptConfig = ICON_PROMPTS[categoryName] || {
    prompt: `A minimalist flat white icon representing ${categoryName} centered on solid #3B82F6 (blue-500) background, clean simple design, no gradients`,
    color: DEFAULT_COLOR
  };

  const prompt = `${promptConfig.prompt}. Generate as a simple square PNG icon 512x512 pixels, white icon centered on solid colored background, flat minimalist style, no gradients or shadows.`;

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
      maxOutputTokens: 8192
    },
    responseModalities: ["image"]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
      throw new Error(`Failed to generate icon: ${response.status}`);
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

    throw new Error("No image generated from Gemini");
  } catch (error) {
    console.error("Error generating category icon:", error);
    toast.error("Failed to generate icon. Please try again or upload manually.");
    throw error;
  }
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