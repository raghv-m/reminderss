import { createWorker } from 'tesseract.js';

export interface OCRProgress {
  status: string;
  progress: number;
}

export async function processImageOCR(
  imageFile: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (onProgress) {
        onProgress({
          status: m.status,
          progress: m.progress || 0,
        });
      }
    },
  });

  try {
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();
    return text;
  } catch (error) {
    await worker.terminate();
    throw new Error('Failed to process image: ' + (error as Error).message);
  }
}
