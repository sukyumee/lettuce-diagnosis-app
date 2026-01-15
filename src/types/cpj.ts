// CPJ (Caption-Prompted Judgment) 파이프라인 타입 정의

// Stage 1: 캡션 생성 결과
export interface CaptionResult {
  caption: string;
  qualityScore: number;
  attempts: number;
}

// Stage 2: VQA 답변 결과
export interface VQAResult {
  diagnosisAnswer: string; // 진단 중심 답변
  managementAnswer: string; // 관리 중심 답변
}

// Stage 3: Judge 결과
export interface JudgeResult {
  selectedAnswer: "diagnosis" | "management" | "combined";
  finalAnswer: string;
  reasoning: string;
}

// 전체 CPJ 파이프라인 결과
export interface CPJResult {
  stage1: CaptionResult;
  stage2: VQAResult;
  stage3: JudgeResult;
  processingTime: number;
}

// API 요청/응답 타입
export interface DiagnoseRequest {
  image: string; // base64 인코딩된 이미지
  question?: string; // 사용자 질문 (선택)
}

export interface DiagnoseResponse {
  success: boolean;
  result?: CPJResult;
  error?: string;
}

// 유러피안 양상추 관련 타입
export interface LettuceCondition {
  name: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface DiagnosisDetail {
  conditions: LettuceCondition[];
  overallHealth: number; // 0-100
  recommendations: string[];
}
