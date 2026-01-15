"use client";

import { CheckCircle, Circle, Loader2 } from "lucide-react";

export type PipelineStage = "idle" | "caption" | "vqa" | "judge" | "complete" | "error";

interface PipelineProgressProps {
  currentStage: PipelineStage;
}

const stages = [
  { id: "caption", label: "Stage 1", description: "캡션 생성 및 품질 평가" },
  { id: "vqa", label: "Stage 2", description: "이중 VQA 분석" },
  { id: "judge", label: "Stage 3", description: "최종 답변 선택" },
];

export default function PipelineProgress({ currentStage }: PipelineProgressProps) {
  const getStageStatus = (stageId: string) => {
    const stageOrder = ["idle", "caption", "vqa", "judge", "complete"];
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stageId);

    if (currentStage === "error") return "error";
    if (stageIndex < currentIndex || currentStage === "complete") return "complete";
    if (stageIndex === currentIndex) return "active";
    return "pending";
  };

  if (currentStage === "idle") return null;

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.id);
          return (
            <div key={stage.id} className="flex items-center flex-1">
              {/* Stage Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${status === "complete" ? "bg-lettuce-500 text-white" : ""}
                    ${status === "active" ? "bg-lettuce-100 border-2 border-lettuce-500" : ""}
                    ${status === "pending" ? "bg-gray-100 border-2 border-gray-300" : ""}
                    ${status === "error" ? "bg-red-100 border-2 border-red-500" : ""}
                  `}
                >
                  {status === "complete" && <CheckCircle size={24} />}
                  {status === "active" && (
                    <Loader2 size={24} className="text-lettuce-600 animate-spin" />
                  )}
                  {status === "pending" && <Circle size={24} className="text-gray-400" />}
                  {status === "error" && (
                    <span className="text-red-500 font-bold">!</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`
                      text-sm font-semibold
                      ${status === "complete" ? "text-lettuce-600" : ""}
                      ${status === "active" ? "text-lettuce-600" : ""}
                      ${status === "pending" ? "text-gray-400" : ""}
                      ${status === "error" ? "text-red-500" : ""}
                    `}
                  >
                    {stage.label}
                  </p>
                  <p
                    className={`
                      text-xs mt-1
                      ${status === "active" ? "text-lettuce-500" : "text-gray-500"}
                    `}
                  >
                    {stage.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 rounded transition-all duration-300
                    ${getStageStatus(stages[index + 1].id) !== "pending" ? "bg-lettuce-500" : "bg-gray-200"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
