import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithImage, callClaude } from "@/lib/claude";
import {
  CAPTION_SYSTEM_PROMPT,
  CAPTION_USER_PROMPT,
  QUALITY_EVAL_SYSTEM_PROMPT,
  QUALITY_EVAL_USER_PROMPT,
  VQA_DIAGNOSIS_SYSTEM_PROMPT,
  VQA_DIAGNOSIS_USER_PROMPT,
  VQA_MANAGEMENT_SYSTEM_PROMPT,
  VQA_MANAGEMENT_USER_PROMPT,
  JUDGE_SYSTEM_PROMPT,
  JUDGE_USER_PROMPT,
} from "@/lib/prompts";
import { CPJResult, CaptionResult, VQAResult, JudgeResult } from "@/types/cpj";

const MAX_CAPTION_ATTEMPTS = 3;
const MIN_QUALITY_SCORE = 8;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { image, question, mediaType = "image/jpeg" } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "이미지가 필요합니다." },
        { status: 400 }
      );
    }

    // ========== Stage 1: 캡션 생성 및 품질 평가 ==========
    let captionAttempts = 0;
    let caption = "";
    let qualityScore = 0;

    while (captionAttempts < MAX_CAPTION_ATTEMPTS && qualityScore < MIN_QUALITY_SCORE) {
      captionAttempts++;

      // 캡션 생성
      caption = await callClaudeWithImage(
        CAPTION_SYSTEM_PROMPT,
        CAPTION_USER_PROMPT,
        image,
        mediaType
      );

      // 품질 평가
      const qualityResponse = await callClaude(
        QUALITY_EVAL_SYSTEM_PROMPT,
        QUALITY_EVAL_USER_PROMPT(caption)
      );

      try {
        const jsonMatch = qualityResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          qualityScore = parsed.score || 0;
        }
      } catch {
        qualityScore = 7;
      }
    }

    const stage1Result: CaptionResult = {
      caption,
      qualityScore,
      attempts: captionAttempts,
    };

    // ========== Stage 2: 이중 VQA ==========
    const [diagnosisAnswer, managementAnswer] = await Promise.all([
      callClaude(
        VQA_DIAGNOSIS_SYSTEM_PROMPT,
        VQA_DIAGNOSIS_USER_PROMPT(caption, question)
      ),
      callClaude(
        VQA_MANAGEMENT_SYSTEM_PROMPT,
        VQA_MANAGEMENT_USER_PROMPT(caption, question)
      ),
    ]);

    const stage2Result: VQAResult = {
      diagnosisAnswer,
      managementAnswer,
    };

    // ========== Stage 3: LLM-as-a-Judge ==========
    const judgeResponse = await callClaude(
      JUDGE_SYSTEM_PROMPT,
      JUDGE_USER_PROMPT(caption, diagnosisAnswer, managementAnswer, question)
    );

    let stage3Result: JudgeResult;

    try {
      const jsonMatch = judgeResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        stage3Result = {
          selectedAnswer: parsed.selection || "combined",
          finalAnswer: parsed.finalAnswer || judgeResponse,
          reasoning: parsed.reasoning || "",
        };
      } else {
        stage3Result = {
          selectedAnswer: "combined",
          finalAnswer: judgeResponse,
          reasoning: "자동 통합 답변",
        };
      }
    } catch {
      stage3Result = {
        selectedAnswer: "combined",
        finalAnswer: judgeResponse,
        reasoning: "자동 통합 답변",
      };
    }

    // ========== 최종 결과 ==========
    const result: CPJResult = {
      stage1: stage1Result,
      stage2: stage2Result,
      stage3: stage3Result,
      processingTime: Date.now() - startTime,
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Diagnose API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "진단 처리 중 오류가 발생했습니다.",
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
