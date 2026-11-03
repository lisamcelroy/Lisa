// On-device text recognition with Tesseract.js, loaded only when first needed.
const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

let loading = null;

function loadTesseract() {
  if (globalThis.Tesseract) return Promise.resolve(globalThis.Tesseract);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = TESSERACT_URL;
      s.onload = () => resolve(globalThis.Tesseract);
      s.onerror = () => {
        loading = null;
        reject(new Error("Could not load the text scanner. Check your internet connection."));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/**
 * Read the text from an image file.
 * @param {File|Blob} file
 * @param {(pct:number)=>void} onProgress  0-100
 */
export async function recognizeText(file, onProgress = () => {}) {
  const Tesseract = await loadTesseract();
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress(Math.round(m.progress * 100));
    },
  });
  return data.text;
}
