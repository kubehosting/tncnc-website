/** Turn a stored upload path into a URL the app itself serves. */
export function mediaUrl(url: string | null | undefined) {
  if (!url) {
    return "";
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("/uploads/")) {
    return `/api/media/${trimmed.slice("/uploads/".length)}`;
  }
  return trimmed;
}
