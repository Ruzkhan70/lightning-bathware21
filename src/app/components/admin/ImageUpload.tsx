import { useState, useCallback, useRef } from "react";
import { Upload, X, Link as LinkIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    
    // Using ImgBB free API (anonymous uploads, 3200px limit)
    const response = await fetch("https://api.imgbb.com/1/upload?key=d36eb6591370aa4f4a3431f4f7e2c982", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    
    const data = await response.json();
    return data.data.url;
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image size should be less than 8MB");
      return;
    }

    setIsUploading(true);
    toast.info("Uploading image to CDN...");

    try {
      const imageUrl = await uploadToImgBB(file);
      onChange(imageUrl);
      toast.success("Image uploaded to CDN successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload. Try using an image URL instead.");
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
      toast.success("Image URL saved!");
    }
  };

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
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[150px]
          ${isDragging ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-300 hover:border-[#D4AF37]"}
          ${value ? "bg-gray-50" : "bg-white"}
          ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
        />

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Uploading to CDN...</p>
            </div>
          </div>
        )}

        {value && !isUploading ? (
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
        ) : !isUploading ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-500 mt-1">Images upload to fast CDN</p>
          </div>
        ) : null}
      </div>
      
      {/* URL Input Option */}
      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL here"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
          />
          <button
            onClick={handleUrlSubmit}
            className="px-4 py-2 bg-[#D4AF37] text-black rounded-lg text-sm font-medium hover:bg-[#C5A028]"
          >
            Save
          </button>
          <button
            onClick={() => {
              setShowUrlInput(false);
              setUrlInput("");
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowUrlInput(true);
          }}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4AF37] transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          Or use an image URL instead
        </button>
      )}
      
      {value && (
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-gray-400 truncate flex-1">{value}</p>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>
        </div>
      )}
    </div>
  );
}
