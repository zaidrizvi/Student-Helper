const pdfParse = require('pdf-parse');       // PDF text extraction
const mammoth = require('mammoth');          // DOCX extraction
const Tesseract = require('tesseract.js');   // OCR fallback
const path = require('path');
const fs = require('fs');
const os = require('os');

const POPPLER_SUPPORTED_PLATFORMS = new Set(['win32', 'darwin']);

function loadPdfPoppler() {
  if (!POPPLER_SUPPORTED_PLATFORMS.has(os.platform())) {
    return null;
  }

  try {
    return require('pdf-poppler'); // PDF to Image conversion for scanned PDFs
  } catch (err) {
    console.warn('pdf-poppler unavailable; scanned PDF OCR fallback is disabled.');
    return null;
  }
}

class FileParserService {
  
  constructor() {
    // Ensure a temp directory exists for processing files
    this.tempDir = path.join(__dirname, '../temp_processing');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Parse uploaded file and extract text.
   * Now supports: PDF, DOCX, TXT, JPG, PNG, WEBP
   */
  async parseFile(file) {
    if (!file) throw new Error('No file provided');
    let text = '';
    const mime = file.mimetype;

    console.log(`Processing file type: ${mime}`); // Debug log

    switch (mime) {
      // -------------------------
      // PDF PROCESSING
      // -------------------------
      case 'application/pdf': {
        try {
          const pdf = await pdfParse(file.buffer);
          text = pdf.text;

          // If text is scanty (scanned PDF), use OCR fallback
          if (!text || text.trim().length < 20) {
            console.log("PDF appears scanned. Switching to OCR...");
            text = await this.ocrPdfFallback(file.buffer);
          }
        } catch (err) {
          console.error("Standard PDF parse failed, trying OCR:", err);
          text = await this.ocrPdfFallback(file.buffer);
        }
        break;
      }

      // -------------------------
      // WORD DOC PROCESSING
      // -------------------------
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const { value } = await mammoth.extractRawText({ buffer: file.buffer });
        text = value;
        break;
      }

      // -------------------------
      // TEXT FILE PROCESSING
      // -------------------------
      case 'text/plain': {
        text = file.buffer.toString();
        break;
      }

      // -------------------------
      // IMAGE PROCESSING (NEW)
      // -------------------------
      case 'image/jpeg':
      case 'image/png':
      case 'image/webp':
      case 'image/jpg': {
        try {
           console.log("Image detected. Running OCR...");
           // Tesseract works directly with image buffers, so no need for temp files here
           const { data: { text: ocrText } } = await Tesseract.recognize(file.buffer, 'eng');
           text = ocrText;
        } catch (err) {
           console.error("Image OCR failed:", err);
           throw new Error("Failed to read text from image.");
        }
        break;
      }

      default:
        throw new Error(`Unsupported file format: ${mime}. Please upload PDF, DOCX, TXT, or Images (JPG/PNG).`);
    }

    // Final check for empty content
    if (!text || !text.trim()) {
         throw new Error('The file appears to be empty or contains no readable text.');
    }
    
    return text;
  }

  /**
   * SPECIALIZED FALLBACK FOR PDFs (Uses pdf-poppler)
   */
  async ocrPdfFallback(buffer) {
    const pdfPoppler = loadPdfPoppler();
    if (!pdfPoppler) {
      console.warn('Skipping scanned PDF OCR fallback because pdf-poppler is unavailable on this platform.');
      return "";
    }

    const uniqueId = Date.now() + '_' + Math.round(Math.random() * 1000);
    const tempPdfPath = path.join(this.tempDir, `temp_${uniqueId}.pdf`);
    const outputPrefix = `img_${uniqueId}`;

    try {
      fs.writeFileSync(tempPdfPath, buffer);

      const options = {
        format: 'jpeg',
        out_dir: this.tempDir,
        out_prefix: outputPrefix,
        page: null 
      };

      await pdfPoppler.convert(tempPdfPath, options);

      const files = fs.readdirSync(this.tempDir)
        .filter(file => file.startsWith(outputPrefix) && file.endsWith('.jpg'))
        .sort(); 

      let fullText = "";

      for (const file of files) {
        const imagePath = path.join(this.tempDir, file);
        // Reuse Tesseract for converted PDF pages
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
        fullText += text + "\n\n";
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
