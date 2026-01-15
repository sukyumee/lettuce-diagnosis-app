import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithImage } from "@/lib/claude";
import { CPJResult } from "@/types/cpj";

// 단일 통합 진단 프롬프트 (타임아웃 방지)
const UNIFIED_DIAGNOSIS_PROMPT = `당신은 식물공장에서 재배되는 유러피안 양상추(European Lettuce) 전문 진단가입니다.

이 이미지를 분석하여 다음 형식으로 종합 진단 결과를 제공하세요:

## 이미지 분석
[식물체의 전반적인 상태, 잎 색상, 형태, 결구 상태 등 상세 기술]

## 진단 결과
**주요 진단**: [가장 가능성 높은 문제점]
**부수 진단**: [추가로 의심되는 문제들]
**심각도**: [낮음/중간/높음]
**신뢰도**: [높음/중간/낮음]

## 원인 분석
[증상의 원인 분석 - 영양 결핍, 환경 스트레스, 병해충 등]

## 관리 방안
1. **즉시 조치**: [24시간 내 필요한 조치]
2. **환경 조절**: [온도, 습도, 광량 조절 방안]
3. **양액 관리**: [EC, pH, 영양소 조절]
4. **예방 조치**: [추가 피해 방지]

## 예상 회복 기간
[적절한 조치 시 예상되는 회복 기간]

한국어로 답변하세요.`;

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

    // 사용자 질문이 있으면 프롬프트에 추가
    const userPrompt = question
      ? `${UNIFIED_DIAGNOSIS_PROMPT}\n\n추가 질문: ${question}`
      : UNIFIED_DIAGNOSIS_PROMPT;

    // 단일 API 호출로 진단 완료
    const diagnosisResult = await callClaudeWithImage(
      "당신은 유러피안 양상추 식물공장 전문 진단가입니다. 정확하고 실용적인 진단을 제공합니다.",
      userPrompt,
      image,
      mediaType
    );

    // 결과 구성
    const result: CPJResult = {
      stage1: {
        caption: "통합 진단 모드",
        qualityScore: 10,
        attempts: 1,
      },
      stage2: {
        diagnosisAnswer: diagnosisResult,
        managementAnswer: diagnosisResult,
      },
      stage3: {
        selectedAnswer: "combined",
        finalAnswer: diagnosisResult,
        reasoning: "단일 통합 진단",
      },
      processingTime: Date.now() - startTime,
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Diagnose API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "진단 처리 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
