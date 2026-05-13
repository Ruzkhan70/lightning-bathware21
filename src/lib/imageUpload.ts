export async function uploadImage(file: File): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64 }),
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  const data = await response.json();
  if (!data.url) {
    throw new Error(data.error || "Upload failed");
  }
  return data.url;
}
