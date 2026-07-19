from pathlib import Path
from time import monotonic

import cv2
from mediapipe import Image, ImageFormat
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

MODEL_PATH = Path("tasks/body_pose_landmarker.task")
CAMERA_INDEX = 0
POSE_CONNECTIONS = (
    (0, 1), (1, 2), (2, 3), (3, 7),
    (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10),
    (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 29), (27, 31), (29, 31),
    (24, 26), (26, 28), (28, 30), (28, 32), (30, 32),
)


def visible(point):
    return getattr(point, "visibility", 1.0) > 0.5 and getattr(point, "presence", 1.0) > 0.5


def pixel(point, width, height):
    return int(point.x * width), int(point.y * height)


def draw_pose_landmarks(frame, result):
    height, width = frame.shape[:2]
    for landmarks in result.pose_landmarks:
        for start, end in POSE_CONNECTIONS:
            if visible(landmarks[start]) and visible(landmarks[end]):
                cv2.line(frame, pixel(landmarks[start], width, height), pixel(landmarks[end], width, height), (0, 255, 0), 2)

        for point in landmarks:
            if visible(point):
                cv2.circle(frame, pixel(point, width, height), 4, (0, 0, 255), -1)


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing pose model: {MODEL_PATH}")

    options = vision.PoseLandmarkerOptions(
        base_options=python.BaseOptions(model_asset_path=str(MODEL_PATH)),
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam")

    start = monotonic()
    try:
        with vision.PoseLandmarker.create_from_options(options) as landmarker:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = Image(image_format=ImageFormat.SRGB, data=rgb)
                timestamp_ms = int((monotonic() - start) * 1000)
                result = landmarker.detect_for_video(mp_image, timestamp_ms)

                draw_pose_landmarks(frame, result)
                cv2.imshow("Body Pose Landmarks", frame)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
