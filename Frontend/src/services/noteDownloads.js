import { API_BASE } from "../config/apiBase";

function sanitizeDownloadName(fileName = "note") {
  return String(fileName).replace(/\.[^/.]+$/, "").trim() || "note";
}

function triggerBlobDownload(blob, fileName) {
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function downloadNotePdf({ noteId, token, fileName }) {
  const response = await fetch(`${API_BASE}/notes/${noteId}/download-pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to download PDF.");
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, `${sanitizeDownloadName(fileName)}-ai-study-guide.pdf`);
}

export async function downloadSharedNotePdf({ shareToken, fileName }) {
  const response = await fetch(`${API_BASE}/notes/shared/${shareToken}/download-pdf`);

  if (!response.ok) {
    throw new Error("Failed to download PDF.");
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, `${sanitizeDownloadName(fileName)}-ai-study-guide.pdf`);
}
