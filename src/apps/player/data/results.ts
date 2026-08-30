export type AnswerChoice = "오류 있음" | "오류 없음";

export interface ResultItem {
  title: string;
  selected: AnswerChoice;
  answer: AnswerChoice;
  correct: boolean;
  explanation: string;
}

export const results: ResultItem[] = [
  { title: "처치 카트", selected: "오류 있음", answer: "오류 있음", correct: true, explanation: "손소독제가 환자 접촉 부위보다 너무 높은 위치에 있어 쉽게 오염될 수 있습니다. 눈높이 이하의 깨끗한 위치에 보관해야 합니다." },
  { title: "물품 보관장", selected: "오류 있음", answer: "오류 없음", correct: false, explanation: "해당 사진의 물품들은 모두 적절한 위치와 방법으로 보관되어 있습니다." },
  { title: "손위생 공간", selected: "오류 있음", answer: "오류 있음", correct: true, explanation: "일회용 장갑이 손위생 공간에 보관되어 교차오염의 위험이 있습니다. 손위생 공간에는 장갑을 두지 않아야 합니다." },
  { title: "냉장 약품 보관함", selected: "오류 있음", answer: "오류 있음", correct: true, explanation: "냉장 보관이 필요한 약품이 냉장고 문 쪽에 있어 온도 변화의 영향을 받을 수 있습니다. 냉장고 내부 깊숙한 위치에 보관해야 합니다." },
  { title: "폐기물 보관 구역", selected: "오류 없음", answer: "오류 있음", correct: false, explanation: "주사바늘이 일반 쓰레기통 근처에 노출되어 있습니다. 날카로운 폐기물은 전용 용기에 담아 보관해야 합니다." },
];
