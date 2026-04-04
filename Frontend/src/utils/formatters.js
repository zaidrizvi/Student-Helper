export function formatDate(value, options = {}) {
  if (!value) return "Recently";

  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...options,
    });
  } catch {
    return "Recently";
  }
}

export function formatDateTime(value, options = {}) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      ...options,
    });
  } catch {
    return "Not available";
  }
}

export function getFileBadgeLabel(fileType = "", fileName = "") {
  const normalized = fileType.toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (normalized.includes("pdf") || lowerName.endsWith(".pdf")) return "PDF";
  if (normalized.includes("word") || lowerName.endsWith(".docx")) return "DOCX";
  if (normalized.includes("text") || lowerName.endsWith(".txt")) return "TXT";
  if (normalized.includes("image") || /\.(png|jpe?g|webp)$/i.test(lowerName)) return "IMAGE";
  return "DOC";
}

export function stripMarkdown(text = "") {
  return String(text)
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}
