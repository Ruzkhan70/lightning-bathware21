import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { productName, category, index = 0 } = req.body;

  if (!productName || !category) {
    return res.status(400).json({ error: 'Missing productName or category' });
  }

  if (!OPENAI_API_KEY || OPENAI_API_KEY.length < 10) {
    const fallbacks = [
      `Keep your bathroom organized with this ${productName}. Simple design fits easily in any space. Easy to clean and maintain.`,
      `Tired of clutter? This ${productName} solves the problem. Practical and straightforward for everyday use.`,
      `A simple solution for daily needs. This ${productName} gets the job done without fuss. Built to last.`,
      `Designed for daily use. This ${productName} is straightforward and reliable. No complicated setup needed.`,
      `Compact and practical. This ${productName} works quietly in the background. Easy to install anywhere.`,
    ];
    return res.json({ description: fallbacks[index % fallbacks.length] });
  }

  const systemPrompt = `You are an intelligent backend assistant generating product descriptions.

STRICT RULES:
- Length: 3 to 5 sentences
- Tone: natural, realistic, human-written
- DO NOT use: "perfect for modern homes", "high-quality", "attention to detail", "transform your routine", "premium quality"
- Must vary opening style: direct, problem-solution, functional, or minimal
- Mix sentence lengths
- Focus on practical usage and real benefits

PRODUCT TYPE GUIDANCE:
- Storage/organization items → focus on space saving, keeping things tidy
- Water/hygiene items → focus on ease of use, control, keeping clean
- Comfort items → focus on experience, relaxation
- Durability items → focus on long-lasting, reliable`;

  const userPrompt = `Generate a description for:
- Product: ${productName}
- Category: ${category}

Previous descriptions from this batch: ${index > 0 ? "Make sure this is completely different from previous ones." : ""}

Write it now. No labels. No explanations. Just the description.`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 180,
        temperature: 0.9,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI error:', response.status);
      const fallbacks = [
        `Keep your bathroom organized with this ${productName}. Simple design fits easily in any space. Easy to clean and maintain.`,
        `Tired of clutter? This ${productName} solves the problem. Practical and straightforward for everyday use.`,
        `A simple solution for daily needs. This ${productName} gets the job done without fuss. Built to last.`,
      ];
      return res.json({ description: fallbacks[index % fallbacks.length] });
    }

    const data = await response.json();
    let description = data.choices?.[0]?.message?.content?.trim() || '';

    const bannedPhrases = ['perfect for modern homes', 'high-quality', 'attention to detail', 'transform your routine', 'premium quality'];
    for (const phrase of bannedPhrases) {
      description = description.replace(new RegExp(phrase, 'gi', '[REMOVED]');
    }

    if (description && description.length > 20) {
      return res.json({ description: description.replace(/\[REMOVED\]/g, '') });
    }

    const fallbacks = [
      `Keep your bathroom organized with this ${productName}. Simple design fits easily in any space. Easy to clean and maintain.`,
      `Tired of clutter? This ${productName} solves the problem. Practical and straightforward for everyday use.`,
      `A simple solution for daily needs. This ${productName} gets the job done without fuss. Built to last.`,
    ];
    return res.json({ description: fallbacks[index % fallbacks.length] });
  } catch (error) {
    console.error('OpenAI API error:', error);
    const fallbacks = [
      `Keep your bathroom organized with this ${productName}. Simple design fits easily in any space. Easy to clean and maintain.`,
      `Tired of clutter? This ${productName} solves the problem. Practical and straightforward for everyday use.`,
    ];
    return res.json({ description: fallbacks[index % fallbacks.length] });
  }
}