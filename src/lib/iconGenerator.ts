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

export function getCategoryColor(categoryName: string): string {
  return ICON_PROMPTS[categoryName]?.color || DEFAULT_COLOR;
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

export async function generatePrompt(categoryName: string, type: "icon" | "banner" = "icon"): Promise<string> {
  return getTextPrompt(categoryName, type);
}