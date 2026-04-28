export const ICON_PROMPTS: Record<string, { prompt: string; color: string }> = {
  "Lighting": { prompt: "A minimalist flat white lightbulb icon centered on solid yellow-500 background, clean simple design, no gradients", color: "#EAB308" },
  "Bathroom Fittings": { prompt: "A minimalist flat white bathtub icon centered on solid blue-500 background, clean simple design, no gradients", color: "#3B82F6" },
  "Shower Systems": { prompt: "A minimalist flat white shower head with water drops icon centered on solid sky-500 background, clean simple design, no gradients", color: "#0EA5E9" },
  "Taps & Mixers": { prompt: "A minimalist flat white faucet/tap icon centered on solid gray-500 background, clean simple design, no gradients", color: "#6B7280" },
  "Valves & Cartridges": { prompt: "A minimalist flat white valve wheel icon centered on solid green-500 background, clean simple design, no gradients", color: "#22C55E" },
  "Plumbing Components": { prompt: "A minimalist flat white wrench icon centered on solid teal-500 background, clean simple design, no gradients", color: "#14B8A6" },
  "Drainage & Waste Systems": { prompt: "A minimalist flat white drain pipe icon centered on solid slate-500 background, clean simple design, no gradients", color: "#64748B" },
  "Electrical Hardware": { prompt: "A minimalist flat white lightning bolt icon centered on solid orange-500 background, clean simple design, no gradients", color: "#F97316" },
  "Gas & Utility": { prompt: "A minimalist flat white flame/gas icon centered on solid red-600 background, clean simple design, no gradients", color: "#DC2626" },
  "Construction Tools": { prompt: "A minimalist flat white hard hat icon centered on solid red-500 background, clean simple design, no gradients", color: "#EF4444" },
  "Bathroom Accessories": { prompt: "A minimalist flat white package/box icon centered on solid cyan-500 background, clean simple design, no gradients", color: "#06B6D4" },
  "Appliance Accessories": { prompt: "A minimalist flat white cog/gear icon centered on solid indigo-500 background, clean simple design, no gradients", color: "#6366F1" },
  "Painting & Finishing Tools": { prompt: "A minimalist flat white paint brush icon centered on solid pink-500 background, clean simple design, no gradients", color: "#EC4899" },
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Lighting": "Lightbulb",
  "Bathroom Fittings": "Bath",
  "Shower Systems": "Droplets",
  "Taps & Mixers": "Wrench",
  "Valves & Cartridges": "Gauge",
  "Plumbing Components": "Wrench",
  "Drainage & Waste Systems": "Cable",
  "Electrical Hardware": "Zap",
  "Gas & Utility": "Flame",
  "Construction Tools": "HardHat",
  "Bathroom Accessories": "Package",
  "Appliance Accessories": "Cog",
  "Painting & Finishing Tools": "Paintbrush",
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Lighting": "bg-yellow-500",
  "Bathroom Fittings": "bg-blue-500",
  "Shower Systems": "bg-sky-500",
  "Taps & Mixers": "bg-gray-500",
  "Valves & Cartridges": "bg-green-500",
  "Plumbing Components": "bg-teal-500",
  "Drainage & Waste Systems": "bg-slate-500",
  "Electrical Hardware": "bg-orange-500",
  "Gas & Utility": "bg-red-600",
  "Construction Tools": "bg-red-500",
  "Bathroom Accessories": "bg-cyan-500",
  "Appliance Accessories": "bg-indigo-500",
  "Painting & Finishing Tools": "bg-pink-500",
};

export const BANNER_PROMPTS: Record<string, { prompt: string; color: string }> = {
  "Lighting": { prompt: "A wide hero showroom banner displaying elegant modern ceiling lights and pendant lamps, warm ambient golden lighting, professional product photography, clean white background, no text, no people", color: "#EAB308" },
  "Bathroom Fittings": { prompt: "A luxurious spa bathroom with elegant bath fixtures and polished chrome taps, marble tiles, soft golden lighting, professional product photography, no text, no people", color: "#3B82F6" },
  "Shower Systems": { prompt: "A modern rainfall shower system with sleek chrome finish, clean glass enclosure, water droplets, professional product photography, no text", color: "#0EA5E9" },
  "Taps & Mixers": { prompt: "A collection of elegant bathroom and kitchen faucets with chrome finish, professional product photography, clean background, no text", color: "#6B7280" },
  "Valves & Cartridges": { prompt: "Industrial brass valves and cartridges, professional product photography, clean gray background, no text", color: "#22C55E" },
  "Plumbing Components": { prompt: "Professional plumbing supplies including pipes and fittings, clean studio lighting, no text", color: "#14B8A6" },
  "Drainage & Waste Systems": { prompt: "Clean drainage pipes and waste system components, professional product photography, no text", color: "#64748B" },
  "Electrical Hardware": { prompt: "Electrical switches, outlets and wiring components, professional product photography, clean background, no text", color: "#F97316" },
  "Gas & Utility": { prompt: "Gas cylinders and utility components for home use, professional product photography, no text", color: "#DC2626" },
  "Construction Tools": { prompt: "Professional power tools and construction equipment on workbench, natural lighting, no text", color: "#EF4444" },
  "Bathroom Accessories": { prompt: "Bathroom organization accessories and storage solutions, professional product photography, clean background, no text", color: "#06B6D4" },
  "Appliance Accessories": { prompt: "Home appliance accessories and parts, professional product photography, clean background, no text", color: "#6366F1" },
  "Painting & Finishing Tools": { prompt: "Quality paint brushes and finishing tools, professional product photography, no text", color: "#EC4899" },
};

export const DEFAULT_COLOR = "#3B82F6";
export const DEFAULT_ICON = "Lightbulb";
export const DEFAULT_BG_COLOR = "bg-blue-500";

export function getCategoryIcon(categoryName: string): string {
  if (!categoryName) return DEFAULT_ICON;
  const exact = CATEGORY_ICONS[categoryName];
  if (exact) return exact;
  const lower = categoryName.toLowerCase();
  if (lower.includes("light")) return "Lightbulb";
  if (lower.includes("bath")) return "Bath";
  if (lower.includes("shower") || lower.includes("water")) return "Droplets";
  if (lower.includes("tap") || lower.includes("mixer") || lower.includes("faucet")) return "Wrench";
  if (lower.includes("valve") || lower.includes("cartridge")) return "Gauge";
  if (lower.includes("plumb")) return "Wrench";
  if (lower.includes("drain") || lower.includes("waste")) return "Cable";
  if (lower.includes("electr")) return "Zap";
  if (lower.includes("gas")) return "Flame";
  if (lower.includes("tool") || lower.includes("construct")) return "HardHat";
  if (lower.includes("appliance")) return "Cog";
  if (lower.includes("paint") || lower.includes("finish")) return "Paintbrush";
  if (lower.includes("package") || lower.includes("accessory")) return "Package";
  return DEFAULT_ICON;
}

export function getCategoryColor(categoryName: string, asBgClass = true): string {
  if (!categoryName) return asBgClass ? DEFAULT_BG_COLOR : DEFAULT_COLOR;
  const exact = CATEGORY_COLORS[categoryName];
  if (exact) return exact;
  const lower = categoryName.toLowerCase();
  if (lower.includes("light")) return asBgClass ? "bg-yellow-500" : "#EAB308";
  if (lower.includes("bath")) return asBgClass ? "bg-blue-500" : "#3B82F6";
  if (lower.includes("shower") || lower.includes("water")) return asBgClass ? "bg-sky-500" : "#0EA5E9";
  if (lower.includes("tap") || lower.includes("mixer") || lower.includes("faucet")) return asBgClass ? "bg-gray-500" : "#6B7280";
  if (lower.includes("valve") || lower.includes("cartridge")) return asBgClass ? "bg-green-500" : "#22C55E";
  if (lower.includes("plumb")) return asBgClass ? "bg-teal-500" : "#14B8A6";
  if (lower.includes("drain") || lower.includes("waste")) return asBgClass ? "bg-slate-500" : "#64748B";
  if (lower.includes("electr")) return asBgClass ? "bg-orange-500" : "#F97316";
  if (lower.includes("gas")) return asBgClass ? "bg-red-600" : "#DC2626";
  if (lower.includes("tool") || lower.includes("construct")) return asBgClass ? "bg-red-500" : "#EF4444";
  if (lower.includes("appliance")) return asBgClass ? "bg-indigo-500" : "#6366F1";
  if (lower.includes("paint") || lower.includes("finish")) return asBgClass ? "bg-pink-500" : "#EC4899";
  if (lower.includes("accessory") || lower.includes("package")) return asBgClass ? "bg-cyan-500" : "#06B6D4";
  return asBgClass ? DEFAULT_BG_COLOR : DEFAULT_COLOR;
}

export function getTextPrompt(categoryName: string, type: "icon" | "banner"): string {
  if (type === "icon") {
    const promptConfig = ICON_PROMPTS[categoryName] || {
      prompt: `A minimalist flat white icon representing ${categoryName} centered on solid blue-500 background, clean simple design`,
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