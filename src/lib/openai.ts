const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const uniquenessAngles = [
  "Focus on durability and long-lasting quality",
  "Highlight modern design and aesthetic appeal",
  "Emphasize easy installation and DIY-friendly features",
  "Stress eco-friendly and water-saving benefits",
  "Focus on premium materials and construction",
  "Highlight warranty and customer support",
  "Emphasize space-saving and compact design",
  "Focus on versatility and multi-use features",
];

export async function generateProductDescription(
  productName: string, 
  category: string, 
  productIndex: number = 0
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return generateFallbackDescription(productName, category);
  }

  const angle = uniquenessAngles[productIndex % uniquenessAngles.length];
  const variationTip = productIndex > 0 
    ? ` Also try a slightly different writing style or structure than previous descriptions.` 
    : "";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional product description writer. Write UNIQUE, SEO-friendly descriptions (60-120 words) with varying structures. Each description must be different from others - use different opening words, vary sentence lengths, and highlight different features.",
          },
          {
            role: "user",
            content: `Write a unique product description for: "${productName}" in category: "${category}". ${angle}. Make it distinct with your own wording - do NOT use generic phrases like "High-quality" or "Premium". Start with something fresh.${variationTip}`,
          },
        ],
        max_tokens: 180,
        temperature: 0.9,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }

    const data: OpenAIResponse = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() || "";
    
    if (description) {
      return description;
    }
    
    return generateFallbackDescription(productName, category);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return generateFallbackDescription(productName, category);
  }
}

function generateFallbackDescription(productName: string, category: string): string {
  return `High-quality ${productName} from our ${category} collection. Perfect for modern homes. Durable construction with premium finish. Easy installation and maintenance. Ideal for both residential and commercial use.`;
}

export async function generateBulkDescriptions(
  products: Array<{ name: string; category: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const descriptions: string[] = [];
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const description = await generateProductDescription(product.name, product.category, i);
    descriptions.push(description);
    
    if (onProgress) {
      onProgress(i + 1, products.length);
    }
    
    if (i < products.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 700));
    }
  }
  
  return descriptions;
}
