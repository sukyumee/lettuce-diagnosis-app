import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { JUDGE_SYSTEM_PROMPT, JUDGE_USER_PROMPT } from "@/lib/prompts";
import { JudgeResult } from "@/types/cpj";

export async function POST(request: NextRequest) {
  try {
    const { caption, diagnosisAnswer, managementAnswer, question } = await request.json();

    if (!caption || !diagnosisAnswer || !managementAnswer) {
      return NextResponse.json(
        { success: false, error: "캡션과 두 가지 답변이 모두 필요합니다." },
        { status: 400 }
      );
    }

    // LLM-as-a-Judge로 최종 답변 선택/통합
    const judgeResponse = await callClaude(
      JUDGE_SYSTEM_PROMPT,
      JUDGE_USER_PROMPT(caption, diagnosisAnswer, managementAnswer, question)
    );

    let result: JudgeResult;

    try {
      // JSON 파싱 시도
      const jsonMatch = judgeResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = {
          selectedAnswer: parsed.selection || "combined",
          finalAnswer: parsed.finalAnswer || judgeResponse,
          reasoning: parsed.reasoning || "",
        };
      } else {
        // JSON 형식이 아닌 경우 전체 응답을 사용
        result = {
          selectedAnswer: "combined",
          finalAnswer: judgeResponse,
          reasoning: "자동 통합 답변",
        };
      }
    } catch {
      // JSON 파싱 실패 시 전체 응답을 사용
      result = {
        selectedAnswer: "combined",
        finalAnswer: judgeResponse,
        reasoning: "자동 통합 답변",
      };
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Judge API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Judge 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
