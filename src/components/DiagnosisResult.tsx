"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, BarChart3, MessageSquare } from "lucide-react";
import { CPJResult } from "@/types/cpj";

interface DiagnosisResultProps {
  result: CPJResult;
}

export default function DiagnosisResult({ result }: DiagnosisResultProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}초`;
  };

  return (
    <div className="w-full space-y-4">
      {/* 최종 진단 결과 */}
      <div className="bg-white rounded-xl border-2 border-lettuce-200 overflow-hidden shadow-sm">
        <div className="bg-lettuce-500 text-white px-6 py-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare size={24} />
            진단 결과
          </h2>
        </div>
        <div className="p-6">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: result.stage3.finalAnswer
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n/g, "<br />"),
            }}
          />
        </div>
      </div>

      {/* 처리 정보 */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Clock size={16} />
            처리 시간: {formatTime(result.processingTime)}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 size={16} />
            캡션 품질: {result.stage1.qualityScore}/10
          </span>
          <span className="text-xs bg-lettuce-100 text-lettuce-700 px-2 py-1 rounded">
            {result.stage3.selectedAnswer === "diagnosis" && "진단 중심"}
            {result.stage3.selectedAnswer === "management" && "관리 중심"}
            {result.stage3.selectedAnswer === "combined" && "통합 분석"}
          </span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-lettuce-600 hover:text-lettuce-700 font-medium"
        >
          상세 보기
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 상세 정보 (접을 수 있음) */}
      {showDetails && (
        <div className="space-y-4">
          {/* Stage 1: 캡션 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-blue-800">
                Stage 1: 이미지 캡션 (시도: {result.stage1.attempts}회)
              </h3>
            </div>
            <div className="p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {result.stage1.caption}
            </div>
          </div>

          {/* Stage 2: VQA 답변들 */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* 진단 중심 답변 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-purple-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-purple-800">
                  Stage 2-A: 진단 중심 분석
                </h3>
              </div>
              <div className="p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {result.stage2.diagnosisAnswer}
              </div>
            </div>

            {/* 관리 중심 답변 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-orange-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-orange-800">
                  Stage 2-B: 관리 중심 분석
                </h3>
              </div>
              <div className="p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {result.stage2.managementAnswer}
              </div>
            </div>
          </div>

          {/* Stage 3: Judge 판단 근거 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-green-800">
                Stage 3: Judge 판단 근거
              </h3>
            </div>
            <div className="p-4 text-sm text-gray-700">
              <p>
                <strong>선택:</strong>{" "}
                {result.stage3.selectedAnswer === "diagnosis" && "진단 중심 답변"}
                {result.stage3.selectedAnswer === "management" && "관리 중심 답변"}
                {result.stage3.selectedAnswer === "combined" && "통합 답변"}
              </p>
              <p className="mt-2">
                <strong>근거:</strong> {result.stage3.reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
