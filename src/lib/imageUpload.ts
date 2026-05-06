const IMGBB_API_URL = "https://api.imgbb.com/1/upload";
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || "";

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  
  if (!IMGBB_API_KEY) {
    throw new Error("Image upload API key not configured");
  }
  
  const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error("Upload failed");
  }
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || "Upload failed");
  }
  return data.data.url;
}
