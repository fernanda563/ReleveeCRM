/** Client-side image downscaling that keeps documents legible (max 1800px, JPEG q0.85). */
export async function compressImage(
  file: File,
  maxDimension = 1800,
  quality = 0.85,
): Promise<{ dataUrl: string; mimeType: "image/jpeg" }> {
  const bitmap = await createImageBitmap(file).catch(() => null);

  if (!bitmap) {
    // Fallback: send the original file as-is
    const dataUrl = await fileToDataUrl(file);
    return { dataUrl, mimeType: "image/jpeg" };
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const dataUrl = await fileToDataUrl(file);
    return { dataUrl, mimeType: "image/jpeg" };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return { dataUrl: canvas.toDataURL("image/jpeg", quality), mimeType: "image/jpeg" };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No pudimos leer la imagen"));
    reader.readAsDataURL(file);
  });
}

export function dataUrlBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:[^;]+;base64,/, "");
}
