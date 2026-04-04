const fs = require("fs");
const mammoth = require("mammoth");
const os = require("os");
const path = require("path");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const HttpError = require("../utils/httpError");

const POPPLER_SUPPORTED_PLATFORMS = new Set(["win32", "darwin"]);
const MAX_EXTRACTED_CHARACTERS = 120000;

function loadPdfPoppler() {
  if (!POPPLER_SUPPORTED_PLATFORMS.has(os.platform())) {
    return null;
  }

  try {
    return require("pdf-poppler");
  } catch (err) {
    console.warn("pdf-poppler unavailable; scanned PDF OCR fallback is disabled.");
    return null;
  }
}

function normalizeExtractedText(text) {
  return String(text || "")
    .replace(/\u0000/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_EXTRACTED_CHARACTERS);
}

class FileParserService {
  constructor() {
    this.tempDir = path.join(__dirname, "../temp_processing");
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async parseFile(file) {
    if (!file) {
      throw new HttpError(400, "No file provided");
    }

    let text = "";
    const mime = file.mimetype;

    switch (mime) {
      case "application/pdf": {
        try {
          const pdf = await pdfParse(file.buffer);
          text = pdf.text;

          if (!text || text.trim().length < 20) {
            text = await this.ocrPdfFallback(file.buffer);
          }
        } catch (err) {
          text = await this.ocrPdfFallback(file.buffer);
        }
        break;
      }

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        const { value } = await mammoth.extractRawText({ buffer: file.buffer });
        text = value;
        break;
      }

      case "text/plain": {
        text = file.buffer.toString("utf8");
        break;
      }

      case "image/jpeg":
      case "image/png":
      case "image/webp": {
        text = await this.ocrImageBuffer(file.buffer);
        break;
      }

      default:
        throw new HttpError(
          400,
          "Unsupported file format. Please upload PDF, DOCX, TXT, JPG, PNG, or WEBP."
        );
    }

    const normalizedText = normalizeExtractedText(text);
    if (!normalizedText) {
      throw new HttpError(
        400,
        "The file appears to be empty or contains no readable text."
      );
    }

    return normalizedText;
  }

  async ocrImageBuffer(buffer) {
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(buffer, "eng");
      return text;
    } catch (err) {
      throw new HttpError(422, "Failed to read text from image.");
    }
  }

  async ocrPdfFallback(buffer) {
    const pdfPoppler = loadPdfPoppler();
    if (!pdfPoppler) {
      return "";
    }

    const uniqueId = `${Date.now()}_${Math.round(Math.random() * 1000)}`;
    const tempPdfPath = path.join(this.tempDir, `temp_${uniqueId}.pdf`);
    const outputPrefix = `img_${uniqueId}`;

    try {
      fs.writeFileSync(tempPdfPath, buffer);

      await pdfPoppler.convert(tempPdfPath, {
        format: "jpeg",
        out_dir: this.tempDir,
        out_prefix: outputPrefix,
        page: null,
      });

      const files = fs
        .readdirSync(this.tempDir)
        .filter((file) => file.startsWith(outputPrefix) && file.endsWith(".jpg"))
        .sort();

      let fullText = "";

      for (const file of files) {
        const imagePath = path.join(this.tempDir, file);
        const {
          data: { text },
        } = await Tesseract.recognize(imagePath, "eng");
        fullText += `${text}\n\n`;
        fs.unlinkSync(imagePath);
      }

      return fullText;
    } catch (err) {
      console.error("OCR Conversion Failed:", err);
      return "";
    } finally {
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }
    }
  }
}

module.exports = new FileParserService();
