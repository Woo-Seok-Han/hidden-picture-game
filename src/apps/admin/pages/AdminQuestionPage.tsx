import {
  useEffect,
  useState,
} from "react";

import ErrorAreaEditor from "../components/ErrorAreaEditor";

import type {
  ErrorArea,
  QuestionForm,
} from "../../../domain/question/types";

const initialForm: QuestionForm = {
  imageFile: null,
  imageUrl: "",
  errorAreas: [],
  explanation: "",
  timeLimitSeconds: 30,
};

export default function AdminQuestionPage() {
  const [form, setForm] =
    useState<QuestionForm>(
      initialForm,
    );

  useEffect(() => {
    return () => {
      if (form.imageUrl) {
        URL.revokeObjectURL(
          form.imageUrl,
        );
      }
    };
  }, [form.imageUrl]);

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      alert(
        "이미지 파일만 업로드할 수 있습니다.",
      );

      return;
    }

    if (form.imageUrl) {
      URL.revokeObjectURL(
        form.imageUrl,
      );
    }

    const imageUrl =
      URL.createObjectURL(file);

    setForm({
      ...initialForm,
      imageFile: file,
      imageUrl,
    });
  };

  const handleAddArea = (
    area: ErrorArea,
  ) => {
    setForm((prev) => ({
      ...prev,

      errorAreas: [
        ...prev.errorAreas,
        area,
      ],
    }));
  };

  const handleDeleteArea = (
    id: string,
  ) => {
    setForm((prev) => ({
      ...prev,

      errorAreas:
        prev.errorAreas.filter(
          (area) =>
            area.id !== id,
        ),
    }));
  };

  const handleSave = () => {
    if (!form.imageFile) {
      alert(
        "문제 이미지를 등록해주세요.",
      );

      return;
    }

    const request = {
      errorCount:
        form.errorAreas.length,

      errorAreas:
        form.errorAreas.map(
          ({
            x,
            y,
            width,
            height,
          }) => ({
            x,
            y,
            width,
            height,
          }),
        ),

      explanation:
        form.explanation,

      timeLimitSeconds:
        form.timeLimitSeconds,
    };

    console.log(
      "저장할 문제:",
      request,
    );

    alert(
      "현재는 콘솔에 문제 데이터를 출력합니다.",
    );
  };

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">
            ADMIN
          </span>

          <h1>
            숨은 오류 문제 등록
          </h1>

          <p>
            이미지를 등록하고 오류가
            있는 영역을 직접
            드래그하세요.
          </p>
        </div>
      </div>

      <div className="admin-layout">
        <section className="editor-card">
          {!form.imageUrl ? (
            <label className="upload-area">
              <span className="upload-icon">
                +
              </span>

              <strong>
                문제 이미지 업로드
              </strong>

              <span>
                JPG, PNG 등의 이미지
              </span>

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={
                  handleImageChange
                }
              />
            </label>
          ) : (
            <>
              <div className="editor-toolbar">
                <div>
                  등록된 오류
                  <strong>
                    {
                      form
                        .errorAreas
                        .length
                    }
                  </strong>
                  개
                </div>

                <label className="change-image-button">
                  이미지 변경

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={
                      handleImageChange
                    }
                  />
                </label>
              </div>

              <ErrorAreaEditor
                imageUrl={
                  form.imageUrl
                }
                errorAreas={
                  form.errorAreas
                }
                onAddArea={
                  handleAddArea
                }
                onDeleteArea={
                  handleDeleteArea
                }
              />
            </>
          )}
        </section>

        <aside className="question-form-card">
          <h2>문제 설정</h2>

          <div className="form-field">
            <label>
              오류 개수
            </label>

            <div className="error-count">
              {
                form.errorAreas
                  .length
              }{" "}
              개
            </div>

            <small>
              드래그한 영역 개수로
              자동 계산됩니다.
            </small>
          </div>

          <div className="form-field">
            <label
              htmlFor="timeLimit"
            >
              제한 시간
            </label>

            <div className="input-with-unit">
              <input
                id="timeLimit"
                type="number"
                min={5}
                max={300}
                value={
                  form.timeLimitSeconds
                }
                onChange={(e) =>
                  setForm(
                    (prev) => ({
                      ...prev,
                      timeLimitSeconds:
                        Number(
                          e
                            .target
                            .value,
                        ),
                    }),
                  )
                }
              />

              <span>초</span>
            </div>
          </div>

          <div className="form-field">
            <label
              htmlFor="explanation"
            >
              해설
            </label>

            <textarea
              id="explanation"
              value={
                form.explanation
              }
              placeholder="문제 종료 후 보여줄 해설을 입력해주세요."
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,
                    explanation:
                      e.target
                        .value,
                  }),
                )
              }
            />
          </div>

          <div className="area-list">
            <div className="area-list-title">
              등록된 오류 영역
            </div>

            {form.errorAreas
              .length === 0 ? (
              <p className="empty-area">
                아직 등록된 오류
                영역이 없습니다.
              </p>
            ) : (
              form.errorAreas.map(
                (area, index) => (
                  <div
                    key={
                      area.id
                    }
                    className="area-list-item"
                  >
                    <span>
                      오류{" "}
                      {index +
                        1}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteArea(
                          area.id,
                        )
                      }
                    >
                      삭제
                    </button>
                  </div>
                ),
              )
            )}
          </div>

          <button
            type="button"
            className="save-button"
            onClick={
              handleSave
            }
          >
            문제 저장
          </button>
        </aside>
      </div>
    </main>
  );
}
