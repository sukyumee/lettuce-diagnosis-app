"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Plus, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/imageUtils";

export interface ImageData {
  id: string;
  base64: string;
  mediaType: string;
  preview: string;
}

interface ImageUploaderProps {
  onImagesChange: (images: ImageData[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export default function ImageUploader({
  onImagesChange,
  disabled,
  maxImages = 5
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList) => {
      const remainingSlots = maxImages - images.length;
      const filesToProcess = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, remainingSlots);

      if (filesToProcess.length === 0) return;

      setIsProcessing(true);
      const newImages: ImageData[] = [];

      try {
        for (const file of filesToProcess) {
          // 이미지 압축
          const { base64, mediaType } = await compressImage(file);

          // 미리보기용 URL 생성
          const preview = `data:${mediaType};base64,${base64}`;

          newImages.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            base64,
            mediaType,
            preview,
          });
        }

        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      } catch (error) {
        console.error("이미지 처리 오류:", error);
        alert("이미지 처리 중 오류가 발생했습니다.");
      } finally {
        setIsProcessing(false);
      }
    },
    [images, maxImages, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || isProcessing || images.length >= maxImages) return;

      processFiles(e.dataTransfer.files);
    },
    [disabled, isProcessing, images.length, maxImages, processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processFiles]
  );

  const handleRemoveImage = useCallback((id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const handleClearAll = useCallback(() => {
    setImages([]);
    onImagesChange([]);
  }, [onImagesChange]);

  return (
    <div className="w-full space-y-4">
      {/* 이미지 미리보기 그리드 */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {images.length}/{maxImages} 이미지
            </span>
            {!disabled && !isProcessing && (
              <button
                onClick={handleClearAll}
                className="text-sm text-red-500 hover:text-red-600"
              >
                전체 삭제
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-lettuce-200 bg-white"
              >
                <img
                  src={img.preview}
                  alt="업로드된 양상추"
                  className="w-full h-full object-cover"
                />
                {!disabled && !isProcessing && (
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label="이미지 삭제"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}

            {/* 추가 업로드 버튼 */}
            {images.length < maxImages && !disabled && (
              <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-lettuce-400 flex items-center justify-center cursor-pointer transition-colors bg-gray-50 hover:bg-lettuce-50 ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isProcessing ? (
                  <Loader2 size={24} className="text-gray-400 animate-spin" />
                ) : (
                  <Plus size={24} className="text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 업로드 영역 (이미지가 없을 때) */}
      {images.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
          className={`
            relative w-full h-64 border-2 border-dashed rounded-xl
            flex flex-col items-center justify-center gap-4
            transition-all cursor-pointer
            ${isDragging ? "border-lettuce-500 bg-lettuce-50" : "border-gray-300 hover:border-lettuce-400 hover:bg-gray-50"}
            ${disabled || isProcessing ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="p-4 bg-lettuce-100 rounded-full">
            {isProcessing ? (
              <Loader2 size={40} className="text-lettuce-600 animate-spin" />
            ) : isDragging ? (
              <Upload size={40} className="text-lettuce-600" />
            ) : (
              <ImageIcon size={40} className="text-lettuce-600" />
            )}
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-medium">
              {isProcessing
                ? "이미지 처리 중..."
                : isDragging
                ? "이미지를 놓으세요"
                : "이미지를 드래그하거나 클릭하여 업로드"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              JPG, PNG, WebP 지원 | 최대 {maxImages}장 | 자동 압축
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
        multiple
      />
    </div>
  );
}
