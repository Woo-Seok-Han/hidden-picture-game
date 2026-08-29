import { useState } from "react";
import type { ErrorArea } from "../../../domain/question/types";

interface Point {
  x: number;
  y: number;
}

interface Props {
  imageUrl: string;
  errorAreas: ErrorArea[];
  onAddArea: (area: ErrorArea) => void;
  onDeleteArea: (id: string) => void;
}

export default function ErrorAreaEditor({
  imageUrl,
  errorAreas,
  onAddArea,
  onDeleteArea,
}: Props) {
  const [startPoint, setStartPoint] =
    useState<Point | null>(null);

  const [currentPoint, setCurrentPoint] =
    useState<Point | null>(null);

  const getRelativePoint = (
    event: React.PointerEvent<HTMLDivElement>,
  ): Point => {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const x =
      (event.clientX - rect.left) /
      rect.width;

    const y =
      (event.clientY - rect.top) /
      rect.height;

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    const point = getRelativePoint(event);

    setStartPoint(point);
    setCurrentPoint(point);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!startPoint) {
      return;
    }

    setCurrentPoint(
      getRelativePoint(event),
    );
  };

  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!startPoint) {
      return;
    }

    const endPoint =
      getRelativePoint(event);

    const x = Math.min(
      startPoint.x,
      endPoint.x,
    );

    const y = Math.min(
      startPoint.y,
      endPoint.y,
    );

    const width = Math.abs(
      endPoint.x - startPoint.x,
    );

    const height = Math.abs(
      endPoint.y - startPoint.y,
    );

    // 실수로 클릭만 한 경우 영역 생성 방지
    if (
      width >= 0.01 &&
      height >= 0.01
    ) {
      onAddArea({
        id: crypto.randomUUID(),
        x,
        y,
        width,
        height,
      });
    }

    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handlePointerCancel = () => {
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const draggingArea =
    startPoint && currentPoint
      ? {
          x: Math.min(
            startPoint.x,
            currentPoint.x,
          ),
          y: Math.min(
            startPoint.y,
            currentPoint.y,
          ),
          width: Math.abs(
            currentPoint.x -
              startPoint.x,
          ),
          height: Math.abs(
            currentPoint.y -
              startPoint.y,
          ),
        }
      : null;

  return (
    <div className="error-area-editor">
      <div
        className="image-container"
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
      >
        <img
          src={imageUrl}
          alt="문제"
          draggable={false}
          className="question-image"
        />

        {errorAreas.map(
          (area, index) => (
            <div
              key={area.id}
              className="error-area-box"
              style={{
                left: `${area.x * 100}%`,
                top: `${area.y * 100}%`,
                width: `${area.width * 100}%`,
                height: `${area.height * 100}%`,
              }}
            >
              <button
                type="button"
                className="area-number"
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();

                  onDeleteArea(
                    area.id,
                  );
                }}
              >
                {index + 1}
              </button>
            </div>
          ),
        )}

        {draggingArea && (
          <div
            className="error-area-box dragging"
            style={{
              left: `${draggingArea.x * 100}%`,
              top: `${draggingArea.y * 100}%`,
              width: `${draggingArea.width * 100}%`,
              height: `${draggingArea.height * 100}%`,
            }}
          />
        )}
      </div>

      <p className="editor-help">
        이미지에서 오류 영역을
        드래그하세요. 번호를 누르면
        해당 영역이 삭제됩니다.
      </p>
    </div>
  );
}
