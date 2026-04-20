import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const typeKeywords: Record<string, string[]> = {
  tap: ['tap', 'mixer', 'faucet', 'bib', 'valve', 'spout', 'bath', 'sink', 'basin'],
  shower: ['shower', 'head', 'rain', 'jet', 'handset', 'slide', 'diverter'],
  storage: ['holder', 'rack', 'shelf', 'hook', 'basket', 'stand', 'stool', 'rod', 'rail'],
  bidet: ['bidet', 'spray', 'wash'],
  accessories: ['soap', 'dish', 'tray', 'mat', 'mirror', 'light', 'lamp'],
};

function getProductType(name: string, category: string): string {
  const text = (name + ' ' + category).toLowerCase();
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      return type;
    }
  }
  return 'tap';
}

function getFallback(name: string, type: string): string {
  const fallbacks: Record<string, string[]> = {
    tap: [`Control water flow easily with this ${name}. Smooth operation for everyday use.`, `This ${name} gives you reliable water control. Built for daily use.`],
    shower: [`Enjoy a better shower with this ${name}. Good water flow and easy to use.`, `This ${name} improves your shower experience. Simple to install.`],
    storage: [`Keep things organized with this ${name}. Easy to mount and clean.`, `This ${name} helps you stay organized. Compact design.`],
    bidet: [`Get clean with this ${name}. Easy to use and install.`, `This ${name} gives you control. Hygienic and comfortable.`],
    accessories: [`This ${name} is practical. Easy to use.`, `Add functionality with this ${name}. Simple and reliable.`],
  };
  return (fallbacks[type] || fallbacks.tap)[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { productName, category, index = 0, productType } = req.body || {};

    if (!productName) {
      return res.status(400).json({ error: 'Missing productName' });
    }

    const detectedType = productType && productType.length > 0 ? productType : getProductType(productName, category || '');

    if (!OPENAI_API_KEY || OPENAI_API_KEY.length < 10) {
      return res.json({ description: getFallback(productName, detectedType) });
    }

    const typeFocus: Record<string, string> = {
      tap: 'Focus on water control, smooth operation, durability. Use words like control, flow, smooth, reliable.',
      shower: 'Focus on water flow, comfort, shower experience. Use words like flow, comfort, rinse, relax.',
      storage: 'Focus on organization, space-saving. Use words like organize, tidy, space, mount.',
      bidet: 'Focus on hygiene, water control, comfort. Use words like clean, spray, control, hygiene.',
      accessories: 'Focus on daily use and practical benefits.',
    };

    const focus = typeFocus[detectedType] || typeFocus.tap;
    const openings = [
      `This ${productName}`,
      `Looking for better water control? This ${productName}`,
      `Need a practical solution? This ${productName}`,
      `For everyday use, this ${productName}`,
      `${productName} is designed`,
    ];
    const opening = openings[index % openings.length];

    const systemMsg = `You write product descriptions. 3-4 sentences. Natural tone. No generic phrases. ${focus}`;
    const userMsg = `${opening}. Write a description.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg },
        ],
        max_tokens: 150,
        temperature: 0.9,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
      }),
    });

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (description && description.length > 20) {
      return res.json({ description });
    }

    return res.json({ description: getFallback(productName, detectedType) });
  } catch (error) {
    console.error('Error:', error);
    return res.json({ description: 'This product works well.' });
  }
}