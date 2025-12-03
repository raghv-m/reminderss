import { useState, useRef, DragEvent } from 'react';
import { Upload, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { processImageOCR, OCRProgress } from '../lib/ocr';
import { parseShiftsFromText, ParsedShift } from '../lib/shiftParser';

interface ShiftUploaderProps {
  onShiftsParsed: (shifts: ParsedShift[]) => void;
  onError: (error: string) => void;
}

export function ShiftUploader({ onShiftsParsed, onError }: ShiftUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Please upload an image file');
      return;
    }

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    setIsProcessing(true);
    setProgress({ status: 'Initializing...', progress: 0 });

    try {
      // Run OCR
      const ocrText = await processImageOCR(file, setProgress);
      
      if (!ocrText || ocrText.trim().length === 0) {
        throw new Error('No text found in image. Please try a clearer photo.');
      }

      setProgress({ status: 'Parsing shifts...', progress: 0.9 });

      // Parse shifts from OCR text
      const parsedShifts = parseShiftsFromText(ocrText);

      if (parsedShifts.length === 0) {
        throw new Error('No shifts found in image. Please make sure your schedule is clearly visible.');
      }

      setProgress({ status: 'Complete!', progress: 1 });
      onShiftsParsed(parsedShifts);

    } catch (error) {
      console.error('OCR Error:', error);
      onError((error as Error).message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
      setProgress(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-dark-700 hover:border-dark-600 bg-dark-800/30'
          }
          ${isProcessing ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center gap-4">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              <div className="text-center">
                <p className="font-medium mb-2">{progress?.status || 'Processing...'}</p>
                {progress && progress.progress > 0 && (
                  <div className="w-64 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-green-500 transition-all duration-300"
                      style={{ width: `${progress.progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
                  {previewUrl ? (
                    <ImageIcon className="w-8 h-8 text-primary-400" />
                  ) : (
                    <Upload className="w-8 h-8 text-primary-400" />
                  )}
                </div>
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-lg font-medium mb-1">
                  {isDragging ? 'Drop your schedule here' : 'Upload Schedule Screenshot'}
                </p>
                <p className="text-sm text-dark-400">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-dark-500 mt-2">
                  Supports JPG, PNG, HEIC • AI will extract your shifts automatically
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="mt-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
          <p className="text-sm text-dark-400 mb-2">Preview:</p>
          <img 
            src={previewUrl} 
            alt="Schedule preview" 
            className="max-h-32 rounded object-contain"
          />
        </div>
      )}
    </div>
  );
}
