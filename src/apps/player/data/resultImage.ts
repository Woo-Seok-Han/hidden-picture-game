const IMAGE_ORIGIN = "https://img.flickrlab.com";

export function getResultImageUrl(source: string): string {
  try {
    const url = new URL(source);
    if (url.origin !== IMAGE_ORIGIN) return source;

    const transform = url.pathname.match(/^\/cdn-cgi\/image\/([^/]+)\/(.+)$/);
    const imagePath = transform ? transform[2] : url.pathname.slice(1);
    if (!imagePath) return source;

    // Remove size overrides so thumbnails keep the original aspect ratio at 300px.
    const options = (transform?.[1].split(",") ?? []).filter(
      (option) => !/^(width|height|dpr|format)=/.test(option),
    );
    url.pathname = `/cdn-cgi/image/${["width=300", "format=webp", ...options].join(",")}/${imagePath}`;
    return url.toString();
  } catch {
    return source;
  }
}
