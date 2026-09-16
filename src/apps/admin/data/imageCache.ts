import { getResultImageUrl } from "../../player/data/resultImage";

export function getCacheImageUrls(questions: { imageUrl: string }[]): string[] {
  return [...new Set(questions.flatMap(({ imageUrl }) =>
    imageUrl ? [imageUrl, getResultImageUrl(imageUrl)] : [],
  ))];
}

export async function warmImage(url: string, signal: AbortSignal): Promise<void> {
  const request = new AbortController();
  const abort = () => request.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) request.abort();
  const timeout = setTimeout(abort, 30_000);
  try {
    // Bypass the browser cache without changing the CDN cache key. The CDN does
    // not expose CORS headers, so validate the opaque response with an image load.
    await fetch(url, {
      mode: "no-cors", cache: "reload", credentials: "omit",
      headers: { Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
      signal: request.signal,
    });
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      const finish = (error?: Error) => {
        image.onload = null;
        image.onerror = null;
        request.signal.removeEventListener("abort", onAbort);
        if (error) image.removeAttribute("src");
        if (error) reject(error);
        else resolve();
      };
      const onAbort = () => finish(new Error("Image request aborted"));
      image.onload = () => finish();
      image.onerror = () => finish(new Error("Image request failed"));
      request.signal.addEventListener("abort", onAbort, { once: true });
      if (request.signal.aborted) onAbort();
      else image.src = url;
    });
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

export async function warmImages(
  urls: string[], signal: AbortSignal,
  onProgress: (success: number, failed: number) => void,
) {
  let next = 0;
  let success = 0;
  let failed = 0;
  async function worker() {
    while (!signal.aborted && next < urls.length) {
      const url = urls[next++];
      try {
        await warmImage(url, signal);
        if (signal.aborted) return;
        success++;
      } catch {
        if (signal.aborted) return;
        failed++;
      }
      onProgress(success, failed);
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, urls.length) }, worker));
}
