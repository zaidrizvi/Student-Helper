const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 46;
const TOP_MARGIN = 44;
const BOTTOM_MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const COLORS = {
  ink: rgb(0.12, 0.15, 0.23),
  muted: rgb(0.42, 0.46, 0.58),
  brand: rgb(0.34, 0.28, 0.94),
  brandSoft: rgb(0.92, 0.9, 1),
  brandDark: rgb(0.09, 0.12, 0.2),
  line: rgb(0.89, 0.9, 0.95),
  panel: rgb(0.97, 0.98, 1),
  white: rgb(1, 1, 1),
};

function sanitizeFileName(name = "note") {
  return String(name)
    .replace(/\.[^/.]+$/, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim() || "note";
}

function sanitizePdfText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/→/g, "->")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

function toDisplayText(value, fallback = "Not provided") {
  const text = sanitizePdfText(value).trim();
  return text || fallback;
}

function cleanInlineMarkdown(text) {
  return sanitizePdfText(text)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/!\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();
}

function splitLongWord(word, font, size, maxWidth) {
  const chunks = [];
  let current = "";

  for (const char of word) {
    const candidate = current + char;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = char;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function wrapText(text, font, size, maxWidth) {
  const cleaned = cleanInlineMarkdown(text);
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines = [];
  let currentLine = "";

  for (const rawWord of words) {
    const parts =
      font.widthOfTextAtSize(rawWord, size) > maxWidth
        ? splitLongWord(rawWord, font, size, maxWidth)
        : [rawWord];

    for (const word of parts) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function getInsightPayload(note) {
  const latestEntry =
    Array.isArray(note.history) && note.history.length > 0
      ? note.history[note.history.length - 1]
      : null;

  const insight = toDisplayText(
    latestEntry?.answer || note.summary,
    "No AI insight available yet. Generate an analysis first, then download the study guide again."
  );

  const prompt =
    latestEntry?.prompt && latestEntry.prompt !== "(No custom prompt)"
      ? latestEntry.prompt
      : "Standard AI study guide";

  return {
    prompt,
    insight,
    generatedAt: latestEntry?.createdAt || note.createdAt || new Date(),
  };
}

function parseBlocks(markdownText) {
  const lines = sanitizePdfText(markdownText).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paragraph.join(" "),
      });
      paragraph = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({
        type: "bullet",
        text: bulletMatch[1],
      });
      continue;
    }

    const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      flushParagraph();
      blocks.push({
        type: "bullet",
        text: numberedMatch[1],
      });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

function buildStudyTitle(blocks, fileName) {
  const topHeading = blocks.find((block) => block.type === "heading");
  return cleanInlineMarkdown(topHeading?.text || sanitizeFileName(fileName));
}

async function buildExtractedNotesPdf(note) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const insightPayload = getInsightPayload(note);
  const blocks = parseBlocks(insightPayload.insight);
  const studyTitle = buildStudyTitle(blocks, note.fileName);
  const shortHeaderTitle =
    studyTitle.length > 34 ? `${studyTitle.slice(0, 31)}...` : studyTitle;

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - TOP_MARGIN;

  const startNewPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - TOP_MARGIN;

    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 42,
      width: PAGE_WIDTH,
      height: 42,
      color: COLORS.brandDark,
    });

    page.drawText("StudyAssistant AI Study Guide", {
      x: MARGIN_X,
      y: PAGE_HEIGHT - 27,
      size: 11,
      font: fontBold,
      color: COLORS.white,
    });

    page.drawText(shortHeaderTitle, {
      x: PAGE_WIDTH - MARGIN_X - fontRegular.widthOfTextAtSize(shortHeaderTitle, 10),
      y: PAGE_HEIGHT - 26,
      size: 10,
      font: fontRegular,
      color: rgb(0.87, 0.88, 0.97),
    });

    y = PAGE_HEIGHT - 70;
  };

  const ensureSpace = (requiredHeight) => {
    if (y - requiredHeight < BOTTOM_MARGIN) {
      startNewPage();
    }
  };

  const drawWrappedLines = (text, options) => {
    const {
      x,
      maxWidth,
      size,
      lineHeight,
      font,
      color,
      after = 0,
    } = options;

    const lines = wrapText(text, font, size, maxWidth);
    ensureSpace(lines.length * lineHeight + after);

    for (const line of lines) {
      page.drawText(line, {
        x,
        y,
        size,
        font,
        color,
      });
      y -= lineHeight;
    }

    y -= after;
  };

  const drawHeading = (text, level) => {
    const size = level === 1 ? 21 : level === 2 ? 15 : 12.5;
    const lineHeight = level === 1 ? 26 : level === 2 ? 20 : 17;
    const color = level === 1 ? COLORS.brand : COLORS.ink;

    ensureSpace(lineHeight + 16);
    page.drawText(cleanInlineMarkdown(text), {
      x: MARGIN_X,
      y,
      size,
      font: fontBold,
      color,
    });
    y -= lineHeight;

    if (level <= 2) {
      const width = Math.min(
        fontBold.widthOfTextAtSize(cleanInlineMarkdown(text), size) + 6,
        CONTENT_WIDTH
      );
      page.drawRectangle({
        x: MARGIN_X,
        y: y + 6,
        width,
        height: 2,
        color: level === 1 ? COLORS.brand : COLORS.brandSoft,
      });
    }

    y -= 10;
  };

  const drawBullet = (text) => {
    const bulletX = MARGIN_X + 2;
    const textX = MARGIN_X + 18;
    const lineHeight = 17;
    const lines = wrapText(text, fontRegular, 11.3, CONTENT_WIDTH - 18);

    ensureSpace(lines.length * lineHeight + 8);

    page.drawCircle({
      x: bulletX + 4,
      y: y - 5,
      size: 3.1,
      color: COLORS.brand,
    });

    for (const line of lines) {
      page.drawText(line, {
        x: textX,
        y,
        size: 11.3,
        font: fontRegular,
        color: COLORS.ink,
      });
      y -= lineHeight;
    }

    y -= 5;
  };

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 170,
    width: PAGE_WIDTH,
    height: 170,
    color: COLORS.brandDark,
  });

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 176,
    width: PAGE_WIDTH,
    height: 6,
    color: COLORS.brand,
  });

  page.drawText("StudyAssistant", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 42,
    size: 12,
    font: fontBold,
    color: COLORS.white,
  });

  page.drawText("AI Study Guide", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 82,
    size: 28,
    font: fontBold,
    color: COLORS.white,
  });

  const titleLines = wrapText(studyTitle, fontRegular, 13, CONTENT_WIDTH);
  let titleY = PAGE_HEIGHT - 108;
  for (const line of titleLines.slice(0, 2)) {
    page.drawText(line, {
      x: MARGIN_X,
      y: titleY,
      size: 13,
      font: fontRegular,
      color: rgb(0.86, 0.88, 0.98),
    });
    titleY -= 16;
  }

  y = PAGE_HEIGHT - 198;

  page.drawText("Learn From The AI Insight", {
    x: MARGIN_X,
    y,
    size: 13,
    font: fontBold,
    color: COLORS.brand,
  });
  y -= 24;

  for (const block of blocks) {
    if (block.type === "heading") {
      drawHeading(block.text, block.level);
      continue;
    }

    if (block.type === "bullet") {
      drawBullet(block.text);
      continue;
    }

    drawWrappedLines(block.text, {
      x: MARGIN_X,
      maxWidth: CONTENT_WIDTH,
      size: 11.4,
      lineHeight: 18,
      font: fontRegular,
      color: COLORS.ink,
      after: 8,
    });
  }

  const generatedLabel = `Generated ${new Date(insightPayload.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;

  pdfDoc.getPages().forEach((pdfPage, index, pages) => {
    pdfPage.drawLine({
      start: { x: MARGIN_X, y: 26 },
      end: { x: PAGE_WIDTH - MARGIN_X, y: 26 },
      thickness: 1,
      color: COLORS.line,
    });

    pdfPage.drawText(generatedLabel, {
      x: MARGIN_X,
      y: 13,
      size: 9,
      font: fontRegular,
      color: COLORS.muted,
    });

    const pageLabel = `${index + 1} / ${pages.length}`;
    pdfPage.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN_X - fontBold.widthOfTextAtSize(pageLabel, 9),
      y: 13,
      size: 9,
      font: fontBold,
      color: COLORS.muted,
    });
  });

  return {
    pdfBytes: await pdfDoc.save(),
    downloadName: `${sanitizeFileName(note.fileName)}-ai-study-guide.pdf`,
  };
}

module.exports = {
  buildExtractedNotesPdf,
};
