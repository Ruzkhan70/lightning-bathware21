const DESCRIBE_API = "/api/describe";

const fallbackOpenings = [
  "Transform your bathroom routine with",
  "Elevate your space using",
  "Upgrade daily moments with",
  "Experience the difference of",
  "Add a touch of luxury to",
];

const fallbackFeatures = [
  "designed for those who appreciate attention to detail",
  "crafted with premium materials that stand the test of time", 
  "featuring a sleek finish that complements any decor",
  "built for effortless daily use",
  "combining style with practical functionality",
];

export async function generateProductDescription(
  productName: string, 
  category: string, 
  productIndex: number = 0,
  productType?: string
): Promise<string> {
  try {
    const response = await fetch(DESCRIBE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName, category, index: productIndex, productType }),
    });

    if (!response.ok) {
      throw new Error("API error");
    }

    const data = await response.json();
    return data.description || generateFallbackDescription(productName, category, productIndex);
  } catch (error) {
    console.error("Description API error:", error);
    return generateFallbackDescription(productName, category, productIndex);
  }
}

function generateFallbackDescription(productName: string, category: string, index: number = 0): string {
  const opening = fallbackOpenings[index % fallbackOpenings.length];
  const feature = fallbackFeatures[index % fallbackFeatures.length];
  return `${opening} ${productName}, ${feature}. This ${category} piece brings functionality and style to any space. Perfect for everyday use and easy to maintain.`;
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
