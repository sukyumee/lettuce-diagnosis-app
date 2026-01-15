// 이미지 압축 유틸리티
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (여유분 포함)
const MAX_DIMENSION = 2048; // 최대 너비/높이

export async function compressImage(
  file: File
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // 캔버스 생성
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context를 생성할 수 없습니다."));
          return;
        }

        // 크기 계산 (비율 유지하며 최대 크기 제한)
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // 품질 조절하며 압축
        let quality = 0.9;
        let base64 = canvas.toDataURL("image/jpeg", quality);

        // 파일 크기가 제한을 초과하면 품질을 낮춤
        while (base64.length * 0.75 > MAX_FILE_SIZE && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }

        // base64 데이터 부분만 추출
        const base64Data = base64.split(",")[1];

        resolve({
          base64: base64Data,
          mediaType: "image/jpeg",
        });
      };

      img.onerror = () => {
        reject(new Error("이미지를 로드할 수 없습니다."));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽을 수 없습니다."));
    };

    reader.readAsDataURL(file);
  });
}

// 파일 크기 포맷
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
