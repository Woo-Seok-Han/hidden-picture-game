import { useCallback, useEffect, useState } from "react";

import {
  changeAdminQuestionActive,
  createAdminQuestion,
  deleteAdminQuestion,
  fetchAdminQuestions,
  updateAdminQuestion,
} from "../../../api/gameService";
import type { AdminQuestion } from "../../../api/gameService";
import type { ErrorArea, QuestionForm } from "../../../domain/question/types";
import ErrorAreaEditor from "../components/ErrorAreaEditor";

const initialForm: QuestionForm = {
  imageFile: null,
  imageUrl: "",
  errorAreas: [],
  explanation: "",
  timeLimitSeconds: 30,
};

export default function AdminQuestionPage() {
  const [form, setForm] = useState<QuestionForm>(initialForm);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionListError, setQuestionListError] = useState("");
  const [message, setMessage] = useState("");

  const loadQuestions = useCallback(async () => {
    setIsLoadingQuestions(true);
    setQuestionListError("");
    try {
      setQuestions(await fetchAdminQuestions());
    } catch {
      setQuestionListError("저장된 문제 목록을 불러오지 못했습니다. 백엔드 서버 상태를 확인해주세요.");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadQuestions();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadQuestions]);

  useEffect(() => {
    return () => {
      if (form.imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(form.imageUrl);
      }
    };
  }, [form.imageUrl]);

  const resetForm = () => {
    if (form.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.imageUrl);
    }
    setForm(initialForm);
    setEditingQuestionId(null);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    if (form.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.imageUrl);
    }

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imageUrl: URL.createObjectURL(file),
    }));
  };

  const handleAddArea = (area: ErrorArea) => {
    setForm((prev) => ({
      ...prev,
      errorAreas: [...prev.errorAreas, area],
    }));
  };

  const handleDeleteArea = (id: string) => {
    setForm((prev) => ({
      ...prev,
      errorAreas: prev.errorAreas.filter((area) => area.id !== id),
    }));
  };

  const handleEdit = (question: AdminQuestion) => {
    if (form.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.imageUrl);
    }

    setEditingQuestionId(question.id);
    setActiveTab("create");
    setMessage("");
    setForm({
      imageFile: null,
      imageUrl: question.imageUrl,
      errorAreas: question.errorAreas.map((area) => ({
        id: String(area.id ?? crypto.randomUUID()),
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      })),
      explanation: question.explanation,
      timeLimitSeconds: question.timeLimitSeconds,
    });
  };

  const handleToggleActive = async (question: AdminQuestion) => {
    const updatedQuestion = await changeAdminQuestionActive(question.id, !question.active);
    if (!updatedQuestion) {
      setMessage("출제 여부를 변경하지 못했습니다.");
      return;
    }

    setMessage(updatedQuestion.active ? "출제 문제로 변경했습니다." : "비출제 문제로 변경했습니다.");
    await loadQuestions();
  };

  const handleDeleteQuestion = async (id: string) => {
    const deleted = await deleteAdminQuestion(id);
    if (!deleted) {
      setMessage("문제를 삭제하지 못했습니다.");
      return;
    }
    if (editingQuestionId === id) {
      resetForm();
    }
    setMessage("문제를 삭제했습니다.");
    await loadQuestions();
  };

  const handleSave = async () => {
    if (!form.imageFile && !editingQuestionId) {
      alert("문제 이미지를 등록해주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const request = {
      image: form.imageFile,
      imageAlt: "감염관리 문제 이미지",
      errorAreas: form.errorAreas.map(({ x, y, width, height }) => ({
        x,
        y,
        width,
        height,
      })),
      explanation: form.explanation,
      timeLimitSeconds: form.timeLimitSeconds,
    };

    const savedQuestion = editingQuestionId
      ? await updateAdminQuestion(editingQuestionId, request)
      : await createAdminQuestion(request);

    setIsSaving(false);

    if (!savedQuestion) {
      setMessage("문제를 저장하지 못했습니다.");
      return;
    }

    setMessage(editingQuestionId ? "문제를 수정했습니다." : "문제를 저장했습니다.");
    resetForm();
    await loadQuestions();
  };

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>문제 등록 및 관리</h1>
          <p>문제를 계속 업로드하고 출제 여부를 관리하세요.</p>
        </div>
      </div>

      <nav className="admin-tabs" aria-label="관리자 메뉴">
        <button
          type="button"
          className={activeTab === "create" ? "is-active" : ""}
          onClick={() => setActiveTab("create")}
        >
          문제 등록
        </button>
        <button
          type="button"
          className={activeTab === "manage" ? "is-active" : ""}
          onClick={() => setActiveTab("manage")}
        >
          문제 관리
        </button>
      </nav>

      {activeTab === "create" ? (
      <div className="admin-layout">
        <section className="editor-card">
          {!form.imageUrl ? (
            <label className="upload-area">
              <span className="upload-icon">+</span>
              <strong>문제 이미지 업로드</strong>
              <span>JPG, PNG 등의 이미지</span>
              <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            </label>
          ) : (
            <>
              <div className="editor-toolbar">
                <div>
                  등록된 오류
                  <strong>{form.errorAreas.length}</strong>
                  개
                </div>

                <label className="change-image-button">
                  이미지 변경
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </label>
              </div>

              <ErrorAreaEditor
                imageUrl={form.imageUrl}
                errorAreas={form.errorAreas}
                onAddArea={handleAddArea}
                onDeleteArea={handleDeleteArea}
              />
            </>
          )}
        </section>

        <aside className="question-form-card">
          <h2>{editingQuestionId ? "문제 수정" : "문제 설정"}</h2>

          <div className="form-field">
            <label>오류 개수</label>
            <div className="error-count">{form.errorAreas.length} 개</div>
            <small>드래그한 영역 개수로 자동 계산됩니다.</small>
          </div>

          <div className="form-field">
            <label htmlFor="timeLimit">제한 시간</label>
            <div className="input-with-unit">
              <input
                id="timeLimit"
                type="number"
                min={5}
                max={300}
                value={form.timeLimitSeconds}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    timeLimitSeconds: Number(e.target.value),
                  }))
                }
              />
              <span>초</span>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="explanation">해설</label>
            <textarea
              id="explanation"
              value={form.explanation}
              placeholder="문제 종료 후 보여줄 해설을 입력해주세요."
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  explanation: e.target.value,
                }))
              }
            />
          </div>

          <div className="area-list">
            <div className="area-list-title">등록된 오류 영역</div>

            {form.errorAreas.length === 0 ? (
              <p className="empty-area">아직 등록된 오류 영역이 없습니다.</p>
            ) : (
              form.errorAreas.map((area, index) => (
                <div key={area.id} className="area-list-item">
                  <span>오류 {index + 1}</span>
                  <button type="button" onClick={() => handleDeleteArea(area.id)}>
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>

          {message && <p className="admin-message">{message}</p>}

          <button type="button" className="save-button" disabled={isSaving} onClick={handleSave}>
            {isSaving ? "저장 중..." : editingQuestionId ? "문제 수정" : "문제 저장"}
          </button>

          {editingQuestionId && (
            <button type="button" className="cancel-edit-button" onClick={resetForm}>
              새 문제 등록
            </button>
          )}

          <div className="saved-question-list">
            <div className="area-list-title">최근 저장된 문제</div>
            {questionListError ? (
              <p className="empty-area">{questionListError}</p>
            ) : isLoadingQuestions ? (
              <p className="empty-area">문제 목록을 불러오는 중입니다.</p>
            ) : questions.length === 0 ? (
              <p className="empty-area">저장된 문제가 없습니다.</p>
            ) : (
              questions.slice(0, 5).map((question) => (
                <div key={question.id} className="saved-question-item">
                  <button type="button" onClick={() => handleEdit(question)}>
                    <img src={question.imageUrl} alt={question.imageAlt} />
                    <span>문제 {question.questionNumber}</span>
                  </button>
                  <button type="button" className="delete-question-button" onClick={() => setActiveTab("manage")}>
                    관리
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
      ) : (
        <section className="question-management">
          <div className="management-summary">
            <strong>총 {questions.length}문제</strong>
            <span>출제 가능 {questions.filter((question) => question.active).length}문제</span>
          </div>

          {message && <p className="admin-message">{message}</p>}

          {questionListError ? (
            <p className="empty-area">{questionListError}</p>
          ) : isLoadingQuestions ? (
            <p className="empty-area">문제 목록을 불러오는 중입니다.</p>
          ) : questions.length === 0 ? (
            <p className="empty-area">저장된 문제가 없습니다.</p>
          ) : (
            <div className="management-list">
              {questions.map((question) => (
                <article key={question.id} className={`management-item ${question.active ? "" : "is-inactive"}`}>
                  <img src={question.imageUrl} alt={question.imageAlt} />
                  <div className="management-info">
                    <div>
                      <strong>문제 {question.questionNumber}</strong>
                      <span>{question.active ? "출제 중" : "비출제"}</span>
                    </div>
                    <p>{question.explanation || "해설 없음"}</p>
                    <small>
                      제한 {question.timeLimitSeconds}초 · 오류 영역 {question.errorAreas.length}개
                    </small>
                  </div>
                  <div className="management-actions">
                    <button type="button" onClick={() => handleToggleActive(question)}>
                      {question.active ? "비활성" : "활성"}
                    </button>
                    <button type="button" onClick={() => handleEdit(question)}>
                      수정
                    </button>
                    <button type="button" className="delete-question-button" onClick={() => handleDeleteQuestion(question.id)}>
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
