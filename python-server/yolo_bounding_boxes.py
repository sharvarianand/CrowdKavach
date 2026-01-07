import os
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import threading
import time
import base64
from ultralytics import YOLO
from pydantic import BaseModel
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from typing import Dict, Optional
import json

load_dotenv()

# Load YOLO model
model = YOLO("yolov8n.pt")

# Load face detection cascade
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Camera configuration file path
CAMERAS_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "cameras.json")


# Camera data model
class Camera(BaseModel):
    id: str
    name: str
    url: str
    zone: str = "Main Plaza"
    enabled: bool = True


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    zone: Optional[str] = None
    enabled: Optional[bool] = None


# Multi-camera state
cameras: Dict[str, Camera] = {}
camera_frames: Dict[str, np.ndarray] = {}
camera_locks: Dict[str, threading.Lock] = {}
camera_threads: Dict[str, threading.Thread] = {}
camera_reconnect_events: Dict[str, threading.Event] = {}
camera_stop_events: Dict[str, threading.Event] = {}


def load_cameras_from_file():
    """Load camera configuration from JSON file"""
    global cameras
    if os.path.exists(CAMERAS_CONFIG_FILE):
        try:
            with open(CAMERAS_CONFIG_FILE, "r") as f:
                data = json.load(f)
                for cam_data in data.get("cameras", []):
                    cam = Camera(**cam_data)
                    cameras[cam.id] = cam
                print(f"Loaded {len(cameras)} cameras from config file")
        except Exception as e:
            print(f"Error loading cameras config: {e}")

    # If no cameras loaded, try to use legacy DROIDCAM_URL
    if not cameras:
        legacy_url = os.getenv("DROIDCAM_URL")
        if legacy_url:
            default_cam = Camera(
                id="cam-1",
                name="Main Camera",
                url=legacy_url + "/video",
                zone="Main Plaza",
                enabled=True,
            )
            cameras[default_cam.id] = default_cam
            save_cameras_to_file()
            print(f"Created default camera from DROIDCAM_URL: {legacy_url}")


def save_cameras_to_file():
    """Save camera configuration to JSON file"""
    try:
        data = {"cameras": [cam.model_dump() for cam in cameras.values()]}
        with open(CAMERAS_CONFIG_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving cameras config: {e}")


def capture_loop(camera_id: str):
    """Background thread to continuously capture frames from a specific camera"""
    global camera_frames

    while not camera_stop_events.get(camera_id, threading.Event()).is_set():
        camera = cameras.get(camera_id)
        if not camera or not camera.enabled:
            time.sleep(1)
            continue

        print(f"[{camera_id}] Connecting to camera at {camera.url}...")
        cap = cv2.VideoCapture(camera.url, cv2.CAP_FFMPEG)
        
        # Optimize for minimal latency
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize buffer
        cap.set(cv2.CAP_PROP_FPS, 30)  # Set frame rate
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)  # Lower resolution for speed
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))

        if not cap.isOpened():
            print(f"[{camera_id}] Failed to open camera, retrying in 5s...")
            time.sleep(5)
            continue

        print(f"[{camera_id}] Connected!")

        while cap.isOpened():
            # Check for stop signal
            if camera_stop_events.get(camera_id, threading.Event()).is_set():
                break

            # Check for reconnection request
            if camera_reconnect_events.get(camera_id, threading.Event()).is_set():
                print(f"[{camera_id}] Reconnection requested...")
                camera_reconnect_events[camera_id].clear()
                break

            # Grab frame without decoding to flush buffer (reduces latency)
            cap.grab()
            ret, frame = cap.retrieve()
            
            if ret:
                with camera_locks.get(camera_id, threading.Lock()):
                    camera_frames[camera_id] = frame
            else:
                print(f"[{camera_id}] Stream disconnected")
                break
            
            # Small delay to prevent CPU overload
            time.sleep(0.01)

        cap.release()
        time.sleep(1)


def start_camera_thread(camera_id: str):
    """Start capture thread for a camera"""
    if camera_id in camera_threads and camera_threads[camera_id].is_alive():
        return

    camera_locks[camera_id] = threading.Lock()
    camera_reconnect_events[camera_id] = threading.Event()
    camera_stop_events[camera_id] = threading.Event()

    thread = threading.Thread(target=capture_loop, args=(camera_id,), daemon=True)
    camera_threads[camera_id] = thread
    thread.start()
    print(f"Started capture thread for {camera_id}")


def stop_camera_thread(camera_id: str):
    """Stop capture thread for a camera"""
    if camera_id in camera_stop_events:
        camera_stop_events[camera_id].set()
    if camera_id in camera_frames:
        del camera_frames[camera_id]
    print(f"Stopped capture thread for {camera_id}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start capture threads for all cameras when server starts"""
    load_cameras_from_file()
    for camera_id in cameras:
        if cameras[camera_id].enabled:
            start_camera_thread(camera_id)
    yield
    # Stop all threads on shutdown
    for camera_id in list(camera_stop_events.keys()):
        camera_stop_events[camera_id].set()


app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Camera Management Endpoints ==============


@app.get("/cameras")
def list_cameras():
    """List all cameras"""
    result = []
    for cam in cameras.values():
        cam_dict = cam.model_dump()
        cam_dict["status"] = (
            "online"
            if cam.id in camera_frames and camera_frames[cam.id] is not None
            else "offline"
        )
        result.append(cam_dict)
    return {"cameras": result}


@app.post("/cameras")
def add_camera(camera: Camera):
    """Add a new camera"""
    if camera.id in cameras:
        raise HTTPException(status_code=400, detail="Camera ID already exists")

    # Auto-append /video for DroidCam URLs if not present
    if ":4747" in camera.url and not camera.url.endswith("/video"):
        camera.url = camera.url.rstrip("/") + "/video"
        print(f"Auto-appended /video to DroidCam URL: {camera.url}")

    cameras[camera.id] = camera
    save_cameras_to_file()

    if camera.enabled:
        start_camera_thread(camera.id)
        print(f"Camera {camera.id} added and thread started")

    return {"status": "created", "camera": camera.model_dump()}


@app.get("/cameras/{camera_id}")
def get_camera(camera_id: str):
    """Get camera details"""
    if camera_id not in cameras:
        raise HTTPException(status_code=404, detail="Camera not found")

    cam = cameras[camera_id]
    cam_dict = cam.model_dump()
    cam_dict["status"] = (
        "online"
        if camera_id in camera_frames and camera_frames[camera_id] is not None
        else "offline"
    )
    return cam_dict


@app.put("/cameras/{camera_id}")
def update_camera(camera_id: str, update: CameraUpdate):
    """Update camera configuration"""
    if camera_id not in cameras:
        raise HTTPException(status_code=404, detail="Camera not found")

    camera = cameras[camera_id]
    update_data = update.model_dump(exclude_unset=True)

    # Check if URL changed - need to reconnect
    url_changed = "url" in update_data and update_data["url"] != camera.url
    enabled_changed = (
        "enabled" in update_data and update_data["enabled"] != camera.enabled
    )

    # Update camera data
    for key, value in update_data.items():
        setattr(camera, key, value)

    cameras[camera_id] = camera
    save_cameras_to_file()

    # Handle reconnection if needed
    if url_changed and camera.enabled:
        if camera_id in camera_reconnect_events:
            camera_reconnect_events[camera_id].set()

    # Handle enable/disable
    if enabled_changed:
        if camera.enabled:
            start_camera_thread(camera_id)
        else:
            stop_camera_thread(camera_id)

    return {"status": "updated", "camera": camera.model_dump()}


@app.delete("/cameras/{camera_id}")
def delete_camera(camera_id: str):
    """Delete a camera"""
    if camera_id not in cameras:
        raise HTTPException(status_code=404, detail="Camera not found")

    stop_camera_thread(camera_id)
    del cameras[camera_id]
    save_cameras_to_file()

    return {"status": "deleted", "camera_id": camera_id}


# ============== Legacy Single Camera Endpoints (for backward compatibility) ==============


class CameraConfig(BaseModel):
    url: str


@app.get("/config/camera")
def get_camera_config():
    """Get current camera configuration (legacy - returns first camera)"""
    if cameras:
        first_cam = list(cameras.values())[0]
        return {"url": first_cam.url}
    return {"url": ""}


@app.post("/config/camera")
def update_camera_config(config: CameraConfig):
    """Update camera URL (legacy - updates first camera or creates one)"""
    if cameras:
        first_cam_id = list(cameras.keys())[0]
        cameras[first_cam_id].url = config.url
        save_cameras_to_file()
        if first_cam_id in camera_reconnect_events:
            camera_reconnect_events[first_cam_id].set()
    else:
        new_cam = Camera(
            id="cam-1",
            name="Main Camera",
            url=config.url,
            zone="Main Plaza",
            enabled=True,
        )
        cameras[new_cam.id] = new_cam
        save_cameras_to_file()
        start_camera_thread(new_cam.id)

    return {"status": "updated", "url": config.url}


# ============== Frame & Detection Endpoints ==============


def get_frame_for_camera(camera_id: Optional[str] = None):
    """Get frame for a specific camera or first available camera"""
    if camera_id:
        if camera_id not in camera_frames:
            return None
        with camera_locks.get(camera_id, threading.Lock()):
            frame = camera_frames.get(camera_id)
            return frame.copy() if frame is not None else None

    # Default: return first available frame
    for cid, frame in camera_frames.items():
        if frame is not None:
            with camera_locks.get(cid, threading.Lock()):
                return frame.copy()
    return None


@app.get("/get-frame")
def get_frame(camera_id: Optional[str] = None):
    """Return the current frame as base64 encoded image"""
    frame = get_frame_for_camera(camera_id)
    if frame is None:
        return JSONResponse(content={"error": "No frame available"}, status_code=503)

    frame = frame.copy()
    _, jpeg = cv2.imencode(".jpg", frame)
    image_base64 = base64.b64encode(jpeg.tobytes()).decode("utf-8")

    return JSONResponse(content={"image": image_base64})


@app.get("/get-image-with-boxes")
def get_image_with_boxes(camera_id: Optional[str] = None):
    """Return image with bounding box superimposed"""
    frame = get_frame_for_camera(camera_id)
    if frame is None:
        return JSONResponse(content={"error": "No frame available"}, status_code=503)

    frame = frame.copy()
    # Use higher confidence threshold and NMS for stable detection
    results = model(frame, conf=0.45, iou=0.5, classes=[0], verbose=False)

    bounding_boxes = []
    for result in results:
        for box in result.boxes:
            if int(box.cls[0]) == 0:  # Only class 0 (person)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                
                # Filter by minimum size to avoid false positives
                width = x2 - x1
                height = y2 - y1
                if width > 20 and height > 40:  # Minimum person dimensions
                    bounding_boxes.append(
                        {
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2),
                            "confidence": round(confidence, 3),
                        }
                    )

    for box in bounding_boxes:
        x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

    _, jpeg = cv2.imencode(".jpg", frame)
    image_base64 = base64.b64encode(jpeg.tobytes()).decode("utf-8")

    return JSONResponse(
        content={
            "image": image_base64,
            "persons": bounding_boxes,
            "person_count": len(bounding_boxes),
        }
    )


@app.get("/detect")
def detect(camera_id: Optional[str] = None):
    """Return only bounding boxes without the image"""
    frame = get_frame_for_camera(camera_id)
    if frame is None:
        return JSONResponse(content={"error": "No frame available"}, status_code=503)

    frame = frame.copy()
    # Use higher confidence threshold and NMS for stable detection
    results = model(frame, conf=0.45, iou=0.5, classes=[0], verbose=False)

    bounding_boxes = []
    for result in results:
        for box in result.boxes:
            if int(box.cls[0]) == 0:  # Only class 0 (person)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                
                # Filter by minimum size to avoid false positives
                width = x2 - x1
                height = y2 - y1
                if width > 20 and height > 40:  # Minimum person dimensions
                    bounding_boxes.append(
                        {
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2),
                            "confidence": round(confidence, 3),
                        }
                    )

    return JSONResponse(
        content={"persons": bounding_boxes, "person_count": len(bounding_boxes)}
    )


@app.get("/analytics")
def analytics(camera_id: Optional[str] = None):
    """Return analytics data including people count and density"""
    frame = get_frame_for_camera(camera_id)
    if frame is None:
        return JSONResponse(content={"error": "No frame available"}, status_code=503)

    frame = frame.copy()
    # Use higher confidence threshold and NMS for stable detection
    results = model(frame, conf=0.45, iou=0.5, classes=[0], verbose=False)

    person_count = 0
    for result in results:
        for box in result.boxes:
            if int(box.cls[0]) == 0:  # Only class 0 (person)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                width = x2 - x1
                height = y2 - y1
                # Filter by minimum size
                if width > 20 and height > 40:
                    person_count += 1

    frame_height, frame_width = frame.shape[:2]
    frame_area = frame_height * frame_width
    max_capacity = frame_area / 10000
    density_percentage = (
        min(100, int((person_count / max_capacity) * 100)) if max_capacity > 0 else 0
    )

    return JSONResponse(
        content={
            "people_count": person_count,
            "density": density_percentage,
            "timestamp": time.time(),
            "camera_id": camera_id or "default",
        }
    )


@app.get("/analytics/all")
def analytics_all():
    """Return aggregated analytics from all cameras"""
    total_count = 0
    camera_analytics = []

    for cid in cameras:
        frame = get_frame_for_camera(cid)
        if frame is None:
            camera_analytics.append(
                {
                    "camera_id": cid,
                    "camera_name": cameras[cid].name,
                    "people_count": 0,
                    "density": 0,
                    "status": "offline",
                }
            )
            continue

        frame = frame.copy()
        # Use higher confidence threshold and NMS for stable detection
        results = model(frame, conf=0.45, iou=0.5, classes=[0], verbose=False)

        person_count = 0
        for result in results:
            for box in result.boxes:
                if int(box.cls[0]) == 0:  # Only class 0 (person)
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    width = x2 - x1
                    height = y2 - y1
                    # Filter by minimum size
                    if width > 20 and height > 40:
                        person_count += 1

        total_count += person_count

        frame_height, frame_width = frame.shape[:2]
        frame_area = frame_height * frame_width
        max_capacity = frame_area / 10000
        density_percentage = (
            min(100, int((person_count / max_capacity) * 100))
            if max_capacity > 0
            else 0
        )

        camera_analytics.append(
            {
                "camera_id": cid,
                "camera_name": cameras[cid].name,
                "zone": cameras[cid].zone,
                "people_count": person_count,
                "density": density_percentage,
                "status": "online",
            }
        )

    return JSONResponse(
        content={
            "total_people_count": total_count,
            "cameras": camera_analytics,
            "timestamp": time.time(),
        }
    )


# Define zones for coordinate mapping
ZONES = [
    {"id": "entry", "name": "Entry Gate", "x_range": (0, 20), "y_range": (40, 60)},
    {"id": "main", "name": "Main Plaza", "x_range": (20, 70), "y_range": (20, 70)},
    {"id": "stage", "name": "Stage Area", "x_range": (20, 70), "y_range": (0, 25)},
    {"id": "food", "name": "Food Court", "x_range": (70, 100), "y_range": (20, 55)},
    {"id": "exit", "name": "Exit Gate", "x_range": (70, 100), "y_range": (60, 90)},
    {"id": "parking", "name": "Parking", "x_range": (0, 30), "y_range": (70, 100)},
    {"id": "vip", "name": "VIP Area", "x_range": (70, 100), "y_range": (0, 25)},
]


def get_zone_for_position(x_percent, y_percent):
    """Determine which zone a position falls into"""
    for zone in ZONES:
        x_min, x_max = zone["x_range"]
        y_min, y_max = zone["y_range"]
        if x_min <= x_percent <= x_max and y_min <= y_percent <= y_max:
            return zone["name"]
    return "Main Plaza"


@app.get("/coordinates")
def coordinates(camera_id: Optional[str] = None):
    """Return lightweight coordinate data for low-bandwidth mode"""
    frame = get_frame_for_camera(camera_id)
    if frame is None:
        return JSONResponse(content={"error": "No frame available"}, status_code=503)

    frame = frame.copy()
    frame_height, frame_width = frame.shape[:2]

    results = model(frame, verbose=False)

    people = []
    person_id = 1
    for result in results:
        for box in result.boxes:
            if int(box.cls[0]) == 0:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                center_x = ((x1 + x2) / 2) / frame_width * 100
                center_y = ((y1 + y2) / 2) / frame_height * 100
                zone = get_zone_for_position(center_x, center_y)

                people.append(
                    {
                        "id": person_id,
                        "x": round(center_x, 1),
                        "y": round(center_y, 1),
                        "zone": zone,
                    }
                )
                person_id += 1

    frame_area = frame_height * frame_width
    max_capacity = frame_area / 10000
    density_percentage = (
        min(100, int((len(people) / max_capacity) * 100)) if max_capacity > 0 else 0
    )

    return JSONResponse(
        content={
            "timestamp": int(time.time() * 1000),
            "people": people,
            "count": len(people),
            "density": density_percentage,
            "camera_id": camera_id or "default",
        }
    )


# ============== Streaming Endpoints ==============


def generate_stream(camera_id: Optional[str] = None):
    """Generator function for MJPEG streaming"""
    target_camera = camera_id
    while True:
        frame = None
        if target_camera and target_camera in camera_frames:
            with camera_locks.get(target_camera, threading.Lock()):
                if camera_frames.get(target_camera) is not None:
                    frame = camera_frames[target_camera].copy()
        else:
            # Default to first available
            for cid, f in camera_frames.items():
                if f is not None:
                    with camera_locks.get(cid, threading.Lock()):
                        frame = f.copy()
                    break

        if frame is None:
            time.sleep(0.1)
            continue

        _, jpeg = cv2.imencode(".jpg", frame)
        yield (
            b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpeg.tobytes() + b"\r\n"
        )
        time.sleep(0.033)


@app.get("/stream")
def stream(camera_id: Optional[str] = None):
    """Return MJPEG video stream"""
    return StreamingResponse(
        generate_stream(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


def generate_stream_with_boxes(camera_id: Optional[str] = None):
    """Generator function for MJPEG streaming with bounding boxes"""
    target_camera = camera_id
    while True:
        frame = None
        if target_camera and target_camera in camera_frames:
            with camera_locks.get(target_camera, threading.Lock()):
                if camera_frames.get(target_camera) is not None:
                    frame = camera_frames[target_camera].copy()
        else:
            for cid, f in camera_frames.items():
                if f is not None:
                    with camera_locks.get(cid, threading.Lock()):
                        frame = f.copy()
                    break

        if frame is None:
            time.sleep(0.1)
            continue

        # Use higher confidence threshold and NMS for stable detection
        results = model(frame, conf=0.45, iou=0.5, classes=[0], verbose=False)

        bounding_boxes = []
        for result in results:
            for box in result.boxes:
                if int(box.cls[0]) == 0:  # Only class 0 (person)
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    confidence = float(box.conf[0])
                    
                    # Filter by minimum size
                    width = x2 - x1
                    height = y2 - y1
                    if width > 20 and height > 40:
                        bounding_boxes.append(
                        {
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2),
                            "confidence": round(confidence, 3),
                        }
                    )

        for box in bounding_boxes:
            x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        cv2.putText(
            frame,
            f"Persons: {len(bounding_boxes)}",
            (10, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2,
        )

        # Encode with lower quality for faster streaming (60% quality)
        encode_params = [cv2.IMWRITE_JPEG_QUALITY, 60]
        _, jpeg = cv2.imencode(".jpg", frame, encode_params)

        yield (
            b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpeg.tobytes() + b"\r\n"
        )
        time.sleep(0.02)  # ~50 FPS max


@app.get("/stream-with-boxes")
def stream_with_boxes(camera_id: Optional[str] = None):
    """Return MJPEG video stream with bounding boxes"""
    return StreamingResponse(
        generate_stream_with_boxes(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


def blur_faces(frame):
    """Apply blur to detected faces in the frame"""
    try:
        if face_cascade is None or face_cascade.empty():
            return frame, 0

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )

        for x, y, w, h in faces:
            x = max(0, x)
            y = max(0, y)
            w = min(w, frame.shape[1] - x)
            h = min(h, frame.shape[0] - y)

            if w > 0 and h > 0:
                face_region = frame[y : y + h, x : x + w]
                if face_region.size > 0:
                    blur_size = min(99, max(21, (w // 2) * 2 + 1))
                    blurred_face = cv2.GaussianBlur(
                        face_region, (blur_size, blur_size), 30
                    )
                    frame[y : y + h, x : x + w] = blurred_face

        return frame, len(faces)
    except Exception as e:
        print(f"Error in blur_faces: {e}")
        return frame, 0


def blur_upper_body(frame, bounding_boxes):
    """Blur upper portion of detected person bounding boxes"""
    try:
        faces_blurred = 0
        frame_height, frame_width = frame.shape[:2]

        for box in bounding_boxes:
            x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
            head_height = int((y2 - y1) * 0.3)
            head_y2 = y1 + head_height

            x1 = max(0, min(x1, frame_width - 1))
            y1 = max(0, min(y1, frame_height - 1))
            x2 = max(0, min(x2, frame_width))
            head_y2 = max(0, min(head_y2, frame_height))

            width = x2 - x1
            height = head_y2 - y1

            if height > 0 and width > 0:
                head_region = frame[y1:head_y2, x1:x2]
                if head_region.size > 0:
                    try:
                        small = cv2.resize(
                            head_region,
                            (max(1, 8), max(1, 8)),
                            interpolation=cv2.INTER_LINEAR,
                        )
                        pixelated = cv2.resize(
                            small, (width, height), interpolation=cv2.INTER_NEAREST
                        )
                        frame[y1:head_y2, x1:x2] = pixelated
                        faces_blurred += 1
                    except Exception as resize_error:
                        print(f"Resize error: {resize_error}")

        return frame, faces_blurred
    except Exception as e:
        print(f"Error in blur_upper_body: {e}")
        return frame, 0


def generate_stream_with_privacy(camera_id: Optional[str] = None):
    """Generator function for MJPEG streaming with privacy masking"""
    target_camera = camera_id
    while True:
        try:
            frame = None
            if target_camera and target_camera in camera_frames:
                with camera_locks.get(target_camera, threading.Lock()):
                    if camera_frames.get(target_camera) is not None:
                        frame = camera_frames[target_camera].copy()
            else:
                for cid, f in camera_frames.items():
                    if f is not None:
                        with camera_locks.get(cid, threading.Lock()):
                            frame = f.copy()
                        break

            if frame is None:
                time.sleep(0.1)
                continue

            results = model(frame, verbose=False)

            bounding_boxes = []
            for result in results:
                for box in result.boxes:
                    if int(box.cls[0]) == 0:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        confidence = float(box.conf[0])
                        bounding_boxes.append(
                            {
                                "x1": int(x1),
                                "y1": int(y1),
                                "x2": int(x2),
                                "y2": int(y2),
                                "confidence": round(confidence, 3),
                            }
                        )

            frame, faces_blurred = blur_upper_body(frame, bounding_boxes)
            frame, additional_faces = blur_faces(frame)

            for box in bounding_boxes:
                x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            cv2.putText(
                frame,
                f"Persons: {len(bounding_boxes)}",
                (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2,
            )
            cv2.putText(
                frame,
                "PRIVACY MODE",
                (10, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 0, 255),
                2,
            )

            _, jpeg = cv2.imencode(".jpg", frame)

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + jpeg.tobytes() + b"\r\n"
            )
            time.sleep(0.033)
        except Exception as e:
            print(f"Error in privacy stream: {e}")
            time.sleep(0.1)


@app.get("/stream-with-privacy")
def stream_with_privacy(camera_id: Optional[str] = None):
    """Return MJPEG video stream with privacy masking"""
    return StreamingResponse(
        generate_stream_with_privacy(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
