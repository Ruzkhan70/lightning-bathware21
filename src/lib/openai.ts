const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const variationStyles = [
  "Start with a question to engage the reader",
  "Begin with a benefit statement",
  "Start with a sensory detail",
  "Open with a specific use case scenario",
  "Begin with a comparison or contrast",
  "Start with practical advice",
];

export async function generateProductDescription(
  productName: string, 
  category: string, 
  productIndex: number = 0
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return generateFallbackDescription(productName, category);
  }

  const style = variationStyles[productIndex % variationStyles.length];
  const isFirst = productIndex === 0;

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
            content: "You are a skilled e-commerce copywriter. Craft unique, natural-sounding product descriptions that feel human-written. Vary sentence structure, avoid templates, and never repeat generic phrases like 'perfect for modern homes' or 'durable construction'.",
          },
          {
            role: "user",
            content: `Generate a unique, high-quality product description.

Product Name: ${productName}
Category: ${category}

Instructions:
- Write in a natural, premium, and slightly persuasive tone.
- DO NOT repeat generic phrases like "perfect for modern homes" or "durable construction".
- Each description must be UNIQUE and different in structure and wording.
- Mention specific use cases based on the product type.
- Highlight 2–3 realistic features (design, usability, comfort, finish, water efficiency, etc.).
- Keep it concise (3–5 sentences).
- Make it sound human-written, not template-based.`,
          },
        ],
        max_tokens: 200,
        temperature: 1.0,
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
