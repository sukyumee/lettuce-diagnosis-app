"use client";

import { useState, useCallback } from "react";
import { Leaf, Send, AlertCircle, RefreshCw } from "lucide-react";
import ImageUploader, { ImageData } from "@/components/ImageUploader";
import PipelineProgress, { PipelineStage } from "@/components/PipelineProgress";
import DiagnosisResult from "@/components/DiagnosisResult";
import { CPJResult } from "@/types/cpj";

interface DiagnosisResultItem {
  imageId: string;
  preview: string;
  result: CPJResult;
}

export default function Home() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [question, setQuestion] = useState("");
  const [currentStage, setCurrentStage] = useState<PipelineStage>("idle");
  const [results, setResults] = useState<DiagnosisResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImagesChange = useCallback((newImages: ImageData[]) => {
    setImages(newImages);
    setResults([]);
    setError(null);
    setCurrentStage("idle");
  }, []);

  const handleDiagnose = async () => {
    if (images.length === 0) return;

    setError(null);
    setResults([]);
    setCurrentImageIndex(0);

    const newResults: DiagnosisResultItem[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        setCurrentImageIndex(i);
        const image = images[i];

        // Stage 1: 캡션 생성
        setCurrentStage("caption");

        let response;
        try {
          response = await fetch("/api/diagnose", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: image.base64,
              mediaType: image.mediaType,
              question: question || undefined,
            }),
          });
        } catch (fetchError) {
          throw new Error("서버 연결에 실패했습니다. 네트워크를 확인해주세요.");
        }

        // Stage progression
        setCurrentStage("vqa");
        await new Promise((r) => setTimeout(r, 300));
        setCurrentStage("judge");
        await new Promise((r) => setTimeout(r, 300));

        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error(`서버 응답 오류 (상태: ${response.status}). 잠시 후 다시 시도해주세요.`);
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || `이미지 ${i + 1} 진단 중 오류가 발생했습니다.`);
        }

        newResults.push({
          imageId: image.id,
          preview: image.preview,
          result: data.result,
        });

        setResults([...newResults]);
      }

      setCurrentStage("complete");
    } catch (err) {
      setCurrentStage("error");
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      console.error("Diagnosis error:", err);
    }
  };

  const handleReset = () => {
    setImages([]);
    setQuestion("");
    setCurrentStage("idle");
    setResults([]);
    setError(null);
    setCurrentImageIndex(0);
  };

  const isProcessing = currentStage !== "idle" && currentStage !== "complete" && currentStage !== "error";

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-lettuce-500 rounded-full">
              <Leaf size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-lettuce-800">
              유러피안 양상추 진단 시스템
            </h1>
          </div>
          <p className="text-gray-600">
            CPJ 프레임워크 기반 AI 진단 | 식물공장 특화
          </p>
        </header>

        {/* 메인 컨텐츠 */}
        <div className="space-y-6">
          {/* 이미지 업로더 */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              1. 양상추 이미지 업로드 (최대 5장)
            </h2>
            <ImageUploader
              onImagesChange={handleImagesChange}
              disabled={isProcessing}
              maxImages={5}
            />
          </section>

          {/* 질문 입력 */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              2. 질문 입력 (선택사항)
            </h2>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 이 양상추의 잎 끝이 갈색으로 변한 원인이 무엇인가요?"
              className="w-full h-24 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-lettuce-500 focus:ring-2 focus:ring-lettuce-200 outline-none transition-all resize-none"
              disabled={isProcessing}
            />
          </section>

          {/* 진단 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={handleDiagnose}
              disabled={images.length === 0 || isProcessing}
              className={`
                flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-lg
                transition-all duration-300
                ${
                  images.length === 0 || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-lettuce-500 text-white hover:bg-lettuce-600 shadow-lg hover:shadow-xl"
                }
              `}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={24} className="animate-spin" />
                  진단 중... ({currentImageIndex + 1}/{images.length})
                </>
              ) : (
                <>
                  <Send size={24} />
                  {images.length > 0 ? `${images.length}장 진단 시작` : "진단 시작"}
                </>
              )}
            </button>
            {(results.length > 0 || error) && (
              <button
                onClick={handleReset}
                className="px-6 py-4 rounded-xl font-semibold text-lettuce-600 border-2 border-lettuce-500 hover:bg-lettuce-50 transition-all"
              >
                새로 시작
              </button>
            )}
          </div>

          {/* 파이프라인 진행 상황 */}
          {isProcessing && (
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2 text-center">
                이미지 {currentImageIndex + 1}/{images.length} 처리 중
              </p>
              <PipelineProgress currentStage={currentStage} />
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
                <div>
                  <h3 className="font-semibold text-red-800">오류 발생</h3>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 진단 결과 */}
          {results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">
                진단 결과 ({results.length}장)
              </h2>
              {results.map((item, index) => (
                <div key={item.imageId} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={item.preview}
                      alt={`양상추 ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-lettuce-200"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        이미지 {index + 1}
                      </h3>
                      <p className="text-sm text-gray-500">
                        처리 시간: {(item.result.processingTime / 1000).toFixed(1)}초
                      </p>
                    </div>
                  </div>
                  <DiagnosisResult result={item.result} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>CPJ (Caption-Prompted Judgment) Framework</p>
          <p className="mt-1">Powered by Claude API</p>
        </footer>
      </div>
    </main>
  );
}
