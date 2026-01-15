import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithImage, callClaude } from "@/lib/claude";
import {
  CAPTION_SYSTEM_PROMPT,
  CAPTION_USER_PROMPT,
  QUALITY_EVAL_SYSTEM_PROMPT,
  QUALITY_EVAL_USER_PROMPT,
} from "@/lib/prompts";
import { CaptionResult } from "@/types/cpj";

const MAX_ATTEMPTS = 3;
const MIN_QUALITY_SCORE = 8;

export async function POST(request: NextRequest) {
  try {
    const { image, mediaType = "image/jpeg" } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "이미지가 필요합니다." },
        { status: 400 }
      );
    }

    let attempts = 0;
    let caption = "";
    let qualityScore = 0;

    // 품질 점수가 8점 이상이 될 때까지 재생성 (최대 3회)
    while (attempts < MAX_ATTEMPTS && qualityScore < MIN_QUALITY_SCORE) {
      attempts++;

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
        // JSON 파싱 시도
        const jsonMatch = qualityResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          qualityScore = parsed.score || 0;
        }
      } catch {
        // JSON 파싱 실패 시 기본 점수 부여
        qualityScore = 7;
      }
    }

    const result: CaptionResult = {
      caption,
      qualityScore,
      attempts,
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Caption API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "캡션 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
