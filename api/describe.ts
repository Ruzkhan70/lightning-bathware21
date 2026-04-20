import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function detectProductType(category: string, productName: string): string {
  const c = (category + ' ' + productName).toLowerCase();
  if (c.includes('brush') || c.includes('holder') || c.includes('storage') || c.includes('rack') || c.includes('shelf') || c.includes('cabinet') || c.includes('basket') || c.includes('organizer')) {
    return 'storage';
  }
  if (c.includes('bidet') || c.includes('spray') || c.includes('jet') || c.includes('wash')) {
    return 'bidet';
  }
  if (c.includes('shower') || c.includes('head') || c.includes('hand shower') || c.includes('rain')) {
    return 'shower';
  }
  if (c.includes('tap') || c.includes('mixer') || c.includes('faucet') || c.includes('valve')) {
    return 'tap';
  }
  return 'general';
}

const typePrompts = {
  storage: 'Focus on: organization, hygiene, space-saving, keeping items tidy and accessible. Use words like organize, tidy, space, shelf, holder, clean.',
  bidet: 'Focus on: water control, hygiene, ease of use, comfort. Use words like spray, control, hygiene, clean, comfortable, pressure.',
  shower: 'Focus on: water flow, comfort, bathing experience, flexibility, relaxation. Use words like flow, comfort, shower, experience, rinse, relax.',
  tap: 'Focus on: water control, smooth operation, durability, daily use. Use words like control, flow, smooth, durable, reliable, everyday.',
  general: 'Focus on practical daily use and real benefits.',
};

const structureHints = [
  'Start with: "This [product] helps you..."',
  'Start with: "Perfect for..." or "Great for..."',
  'Start with: "Looking for..." or "Need..."',
  'Start with: "When you want..."',
  'Start with: Use direct functional opening',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { productName, category, index = 0, productType: passedType } = req.body;

  if (!productName || !category) {
    return res.status(400).json({ error: 'Missing productName or category' });
  }

  const productType = passedType || detectProductType(category, productName);
  const typeFocus = typePrompts[productType] || typePrompts.tap;
  const structure = structureHints[index % structureHints.length];

  if (!OPENAI_API_KEY || OPENAI_API_KEY.length < 10) {
    const fallbacks: Record<string, string[]> = {
      storage: [
        `This ${productName} helps you keep everything in place. Mounts easily on any wall. Great for small bathrooms.`,
        `No more mess. This ${productName} holds your items securely. Simple to install and clean.`,
        `Fits neatly in corners or walls. This ${productName} maximizes your space while keeping things accessible.`,
      ],
      bidet: [
        `This ${productName} gives you precise water control. Easy to install on any toilet. Simple to use.`,
        `Adjust the spray to your liking with this ${productName}. Hygienic and comfortable for daily use.`,
        `Get the fresh feeling you want. This ${productName} attaches easily and gives you control over water pressure.`,
      ],
      shower: [
        `This ${productName} delivers a satisfying water flow every time. Easy to install and height adjustable.`,
        `Enjoy a better shower experience with this ${productName}. Multiple settings let you customize your rinse.`,
        `Rinse off comfortably. This ${productName} gives you flexibility and great water coverage.`,
      ],
      tap: [
        `This ${productName} offers smooth water control. Built to last with daily use. Easy operation for everyone.`,
        `Get reliable performance from this ${productName}. Smooth handling and consistent flow every time you use it.`,
        `Everyday convenience. This ${productName} is designed for hassle-free operation and long-term durability.`,
      ],
      general: [
        `This ${productName} is practical for everyday use. Easy to install and built to last.`,
        `A straightforward solution. This ${productName} does what it needs to without complications.`,
        `Reliable and simple. This ${productName} works well for daily needs without fuss.`,
      ],
    };
    return res.json({ description: fallbacks[productType][index % fallbacks[productType].length] });
  }

  const systemPrompt = `You are a strict e-commerce description generator.

HARD RULES (NO EXCEPTIONS):
- DO NOT use: "functionality and style", "perfect for everyday use", "transform your routine", "attention to detail", "premium materials", "elevate your space", "designed for those who"
- NO sentence structure repetition
- NO vague or generic lines
- 3-4 sentences only
- Natural, simple, human tone
- Each sentence adds new value, no filler

PRODUCT TYPE: ${productType}
FOCUS: ${typeFocus}

Write for REAL usage, not marketing.`;

  const userPrompt = `Product: ${productName}
Category: ${category}

Description (3-4 sentences, unique, no templates):`;

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
        temperature: 0.95,
        presence_penalty: 0.7,
        frequency_penalty: 0.6,
      }),
    });

    const data = await response.json();
    let description = data.choices?.[0]?.message?.content?.trim() || '';

    const banned = ['perfect for modern homes', 'high-quality', 'premium quality', 'attention to detail', 'transform your routine', 'gets the job done', 'simple solution'];
    for (const b of banned) {
      description = description.replace(new RegExp(b, 'gi', ''));
    }

    if (description && description.length > 20) {
      return res.json({ description });
    }

    const fallbacks = {
      storage: [`This ${productName} keeps things organized. Simple to install.`],
      bidet: [`This ${productName} gives you control. Easy to use.`],
      shower: [`This ${productName} feels nice. Good flow.`],
      tap: [`This ${productName} works well. Smooth operation.`],
      general: [`This ${productName} is useful.`],
    };
    return res.json({ description: fallbacks[productType][0] });
  } catch (error) {
    console.error('API error:', error);
    const fallbacks = { storage: `This ${productName} helps organize.`, bidet: `This ${productName} controls water.`, shower: `This ${productName} improves shower.`, tap: `This ${productName} controls flow.`, general: `This ${productName} is practical.` };
    return res.json({ description: fallbacks[productType] });
  }
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
        temperature: 0.95,
        presence_penalty: 0.7,
        frequency_penalty: 0.6,
      }),
    });

    if (!response.ok) {
      const fallbacks = {
        storage: [`This ${productName} helps organize.`],
        bidet: [`This ${productName} controls water.`],
        shower: [`This ${productName} improves shower.`],
        tap: [`This ${productName} controls flow.`],
        general: [`This ${productName} is useful.`],
      };
      return res.json({ description: fallbacks[productType][0] });
    }

    const data = await response.json();
    let description = data.choices?.[0]?.message?.content?.trim() || '';

    const banned = ['perfect for modern homes', 'high-quality', 'premium quality', 'attention to detail', 'transform your routine', 'gets the job done', 'simple solution', 'functionality and style', 'perfect for everyday use', 'elevate your space', 'designed for those who'];
    for (const b of banned) {
      description = description.replace(new RegExp(b, 'gi'), '');
    }

    if (description && description.length > 20) {
      return res.json({ description });
    }

    return res.json({ description: fallbacks[productType][0] });
  } catch (error) {
    console.error('API error:', error);
    return res.json({ description: `This ${productName} works well.` });
  }
}