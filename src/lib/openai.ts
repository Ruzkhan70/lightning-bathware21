const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function generateProductDescription(productName: string, category: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    return generateFallbackDescription(productName, category);
  }

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
            content: "You are a professional product description writer for a bathroom and hardware store. Write compelling, SEO-friendly product descriptions (50-100 words) that highlight key features and benefits.",
          },
          {
            role: "user",
            content: `Write a product description for: ${productName} in category: ${category}. Make it professional, concise, and appealing to customers.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
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
    const description = await generateProductDescription(product.name, product.category);
    descriptions.push(description);
    
    if (onProgress) {
      onProgress(i + 1, products.length);
    }
    
    // Small delay to avoid rate limiting
    if (i < products.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return descriptions;
}
