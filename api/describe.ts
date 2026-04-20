// @ts-ignore
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { productName, category, index = 0, productType } = req.body || {};

    if (!productName) {
      return res.status(400).json({ error: 'Missing productName' });
    }

    const detectedType = productType && productType.length > 0 ? productType : getProductType(productName, category || '');

    const fallbacks: Record<string, string[]> = {
      tap: [
        `Control water flow easily with this ${productName}. Smooth operation for everyday use.`,
        `This ${productName} gives you reliable water control. Built for daily use.`,
        `Get smooth water control with this ${productName}. Durable and easy to operate.`,
      ],
      shower: [
        `Enjoy a better shower with this ${productName}. Good water flow and easy to use.`,
        `This ${productName} improves your shower experience. Simple to install.`,
        `Feel the difference with this ${productName}. Multiple settings for your comfort.`,
      ],
      storage: [
        `Keep things organized with this ${productName}. Easy to mount and clean.`,
        `This ${productName} helps you stay organized. Compact design.`,
        `Maximize your space with this ${productName}. Simple and practical.`,
      ],
      bidet: [
        `Get clean with this ${productName}. Easy to use and install.`,
        `This ${productName} gives you control. Hygienic and comfortable.`,
        `Fresh and clean with this ${productName}. Simple attachment.`,
      ],
      accessories: [
        `This ${productName} is practical. Easy to use.`,
        `Add functionality with this ${productName}. Simple and reliable.`,
        `A useful addition. This ${productName} works well.`,
      ],
    };

    const typeFallbacks = fallbacks[detectedType] || fallbacks.tap;
    const description = typeFallbacks[index % typeFallbacks.length];

    return res.json({ description });
  } catch (error) {
    console.error('Error:', error);
    return res.json({ description: `This ${req.body?.productName || 'product'} works well.` });
  }
}