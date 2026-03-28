import { useState, useCallback, useRef } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File, maxWidth = 1920, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not create canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          
          if (dataUrl.length > 900 * 1024) {
            dataUrl = canvas.toDataURL("image/jpeg", 0.5);
          }
          
          if (dataUrl.length > 900 * 1024) {
            canvas.width = width * 0.5;
            canvas.height = height * 0.5;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          }

          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB");
      return;
    }

    setIsCompressing(true);
    toast.info("Compressing image...");

    try {
      const compressedDataUrl = await compressImage(file);
      
      const sizeInMB = (compressedDataUrl.length * 3) / 4 / 1024 / 1024;
      if (sizeInMB > 0.9) {
        toast.error("Image is too large even after compression. Please use a smaller image or an image URL instead.");
        setIsCompressing(false);
        return;
      }

      onChange(compressedDataUrl);
      toast.success("Image compressed and saved!");
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to process image. Please try a different image.");
    } finally {
      setIsCompressing(false);
    }
  }, [onChange]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isCompressing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[150px]
          ${isDragging ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-300 hover:border-[#D4AF37]"}
          ${value ? "bg-gray-50" : "bg-white"}
          ${isCompressing ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
        />

        {isCompressing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Compressing...</p>
            </div>
          </div>
        )}

        {value && !isCompressing ? (
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-white flex items-center justify-center shadow-sm">
            <img src={value} alt="Preview" className="max-w-full max-h-full object-contain" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : !isCompressing ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-500 mt-1">Images will be compressed automatically</p>
          </div>
        ) : null}
      </div>
      
      {value && !value.startsWith('data:') && (
         <p className="text-[10px] text-gray-400 truncate">Current URL: {value}</p>
      )}
      
      {value && value.startsWith('data:') && (
        <p className="text-[10px] text-gray-400">
          Image stored as compressed data. For best results, use images under 1MB or use URL instead.
        </p>
      )}
    </div>
  );
}
