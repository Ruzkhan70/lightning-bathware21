import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

function generateFallback(productName: string, category: string, index: number): string {
  const opening = fallbackOpenings[index % fallbackOpenings.length];
  const feature = fallbackFeatures[index % fallbackFeatures.length];
  return `${opening} ${productName}, ${feature}. This ${category} piece brings functionality and style to any space. Perfect for everyday use and easy to maintain.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { productName, category, index = 0 } = req.body;

  if (!productName || !category) {
    return res.status(400).json({ error: 'Missing productName or category' });
  }

  // Check if OpenAI key is available
  if (!OPENAI_API_KEY || OPENAI_API_KEY.length < 10) {
    return res.json({ description: generateFallback(productName, category, index) });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a skilled e-commerce copywriter. Craft unique, natural-sounding product descriptions that feel human-written. Vary sentence structure, avoid templates, and never repeat generic phrases like "perfect for modern homes" or "durable construction".',
          },
          {
            role: 'user',
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
      console.error('OpenAI error:', response.status);
      return res.json({ description: generateFallback(productName, category, index) });
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (description) {
      return res.json({ description });
    }

    return res.json({ description: generateFallback(productName, category, index) });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.json({ description: generateFallback(productName, category, index) });
  }
}