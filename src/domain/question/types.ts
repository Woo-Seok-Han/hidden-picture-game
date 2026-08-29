export interface ErrorArea {
  id: string;

  /**
   * 이미지 대비 비율 좌표
   * 0 ~ 1
   */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuestionForm {
  imageFile: File | null;
  imageUrl: string;

  errorAreas: ErrorArea[];

  explanation: string;

  timeLimitSeconds: number;
}
