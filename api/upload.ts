import type { VercelRequest, VercelResponse } from '@vercel/node';

const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Image upload API key not configured" });
  }

  try {
    const imageBase64 = (req.body.image || "").replace(/^data:image\/\w+;base64,/, "");

    const params = new URLSearchParams();
    params.append("key", apiKey);
    params.append("image", imageBase64);

    const response = await fetch(IMGBB_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();
    if (!data.success) {
      return res.status(400).json({ error: data.error?.message || "Upload failed" });
    }

    return res.json({ url: data.data.url });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
}
