import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import {
  VQA_DIAGNOSIS_SYSTEM_PROMPT,
  VQA_DIAGNOSIS_USER_PROMPT,
  VQA_MANAGEMENT_SYSTEM_PROMPT,
  VQA_MANAGEMENT_USER_PROMPT,
} from "@/lib/prompts";
import { VQAResult } from "@/types/cpj";

export async function POST(request: NextRequest) {
  try {
    const { caption, question } = await request.json();

    if (!caption) {
      return NextResponse.json(
        { success: false, error: "캡션이 필요합니다." },
        { status: 400 }
      );
    }

    // 이중 VQA: 진단 중심과 관리 중심 답변을 병렬로 생성
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

    const result: VQAResult = {
      diagnosisAnswer,
      managementAnswer,
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("VQA API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "VQA 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
