from pathlib import Path
from time import monotonic

import cv2
from mediapipe import Image, ImageFormat
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

MODEL_PATH = Path("tasks/hand_landmarker.task")
CAMERA_INDEX = 0
HAND_CONNECTIONS = (
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (0, 17), (17, 18), (18, 19), (19, 20),
)


def pixel(point, width, height):
    return int(point.x * width), int(point.y * height)


def draw_hand_landmarks(frame, result):
    height, width = frame.shape[:2]
    for landmarks in result.hand_landmarks:
        for start, end in HAND_CONNECTIONS:
            cv2.line(frame, pixel(landmarks[start], width, height), pixel(landmarks[end], width, height), (0, 255, 0), 2)

        for point in landmarks:
            cv2.circle(frame, pixel(point, width, height), 4, (0, 0, 255), -1)


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing hand model: {MODEL_PATH}")

    options = vision.HandLandmarkerOptions(
        base_options=python.BaseOptions(model_asset_path=str(MODEL_PATH)),
        running_mode=vision.RunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam")

    start = monotonic()
    try:
        with vision.HandLandmarker.create_from_options(options) as landmarker:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = Image(image_format=ImageFormat.SRGB, data=rgb)
                timestamp_ms = int((monotonic() - start) * 1000)
                result = landmarker.detect_for_video(mp_image, timestamp_ms)

                draw_hand_landmarks(frame, result)
                cv2.imshow("Hand Landmarks", frame)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
