import axios from "axios";
import { PdfReader } from "pdfreader";
import mammoth from "mammoth";

export async function extractResumeTextFromUrl(url, options = {}) {
  const { timeout = 10000 } = options;

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout,
    });
    const buffer = response.data;
    const contentType = response.headers["content-type"] || "";

    if (contentType.includes("pdf") || url.endsWith(".pdf")) {
      return await extractTextFromPdf(buffer);
    } else if (
      contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
      url.endsWith(".docx")
    ) {
      const { value } = await mammoth.extractRawText({ buffer });
      return value.trim();
    } else {
      throw new Error("Unsupported file type - only PDF and DOCX are supported");
    }
  } catch (error) {
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

async function extractTextFromPdf(buffer) {
  return new Promise((resolve, reject) => {
    let text = "";
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err);
      } else if (!item) {
        resolve(text.trim());
      } else if (item.text) {
        text += item.text + " ";
      }
    });
  });
}