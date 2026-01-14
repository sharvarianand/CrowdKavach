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
    area: Optional[float] = None
    areaUnit: Optional[str] = "sqm"
    densityLevel: Optional[str] = "medium"
    capacity: Optional[int] = None
    useManualCapacity: bool = False


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    zone: Optional[str] = None
    enabled: Optional[bool] = None
    area: Optional[float] = None
    areaUnit: Optional[str] = None
    densityLevel: Optional[str] = None
    capacity: Optional[int] = None
    useManualCapacity: Optional[bool] = None


# Multi-camera state
cameras: Dict[str, Camera] = {}
camera_frames: Dict[str, np.ndarray] = {}
camera_locks: Dict[str, threading.Lock] = {}
camera_threads: Dict[str, threading.Thread] = {}
camera_reconnect_events: Dict[str, threading.Event] = {}
camera_stop_events: Dict[str, threading.Event] = {}
camera_detections: Dict[str, list] = {}
camera_last_detection_time: Dict[str, float] = {}

# Analytics state for "Whole App Sync"
global_analytics = {
    "total_visitors": 0,
    "current_count": 0,  # Live sum of all camera detections
    "peak_hour": "00:00",
    "peak_count": 0,
    "hourly_history": [0] * 24,
    "last_reset_day": time.strftime("%Y-%m-%d"),
    "active_cameras": 0
}
analytics_lock = threading.Lock()


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
        cap = cv2.VideoCapture(camera.url)
        
        if not cap.isOpened():
            # Try without any backends if FFMPEG failed (implicitly tried above)
            print(f"[{camera_id}] Failed to open camera, retrying in 5s...")
            time.sleep(5)
            continue

        print(f"[{camera_id}] Connected!")
        last_yolo_time = 0
        yolo_interval = 0.4  # Run YOLO every 400ms for each camera

        while cap.isOpened():
            if camera_stop_events.get(camera_id, threading.Event()).is_set():
                break

            if camera_reconnect_events.get(camera_id, threading.Event()).is_set():
                print(f"[{camera_id}] Reconnection requested...")
                camera_reconnect_events[camera_id].clear()
                break

            ret, frame = cap.read()
            
            if ret:
                # Store the raw frame
                with camera_locks.get(camera_id, threading.Lock()):
                    camera_frames[camera_id] = frame
                
                # Periodically run YOLO
                current_time = time.time()
                if current_time - last_yolo_time > yolo_interval:
                    # Run YOLO in a way that doesn't block the capture too long
                    # Accuracy: Use lower confidence for better human detection
                    results = model(frame, conf=0.25, iou=0.5, classes=[0], verbose=False)
                    
                    detections = []
                    for result in results:
                        for box in result.boxes:
                            if int(box.cls[0]) == 0:
                                x1, y1, x2, y2 = box.xyxy[0].tolist()
                                width = x2 - x1
                                height = y2 - y1
                                
                                # Accept smaller detections for distant people
                                if width > 15 and height > 30:
                                    detections.append({
                                        "x1": int(x1), "y1": int(y1), 
                                        "x2": int(x2), "y2": int(y2),
                                        "conf": float(box.conf[0])
                                    })
                    
                    if detections:
                        print(f"[{camera_id}] Detected {len(detections)} people")
                    
                    camera_detections[camera_id] = detections
                    camera_last_detection_time[camera_id] = current_time
                    last_yolo_time = current_time
                    
                    # Real-time Alert Sync
                    if ALERTS_ENABLED:
                        cam_data = cameras.get(camera_id)
                        if cam_data and cam_data.enabled:
                            # Use manual capacity if configured, otherwise default
                            capacity = cam_data.capacity if cam_data.capacity is not None else 50
                            check_capacity_violation(
                                zone=cam_data.zone,
                                camera_id=camera_id,
                                people_count=len(detections),
                                max_capacity=capacity
                            )
                    
                    # Update Global Analytics
                    with analytics_lock:
                        # Reset if new day
                        today = time.strftime("%Y-%m-%d")
                        if today != global_analytics["last_reset_day"]:
                            global_analytics.update({
                                "total_visitors": 0,
                                "peak_hour": "00:00",
                                "peak_count": 0,
                                "hourly_history": [0] * 24,
                                "last_reset_day": today
                            })
                        
                        # Calculate total across all active cameras
                        current_total = sum(len(d) for d in camera_detections.values())
                        
                        # Peek count / hour
                        current_hour_idx = int(time.strftime("%H"))
                        global_analytics["hourly_history"][current_hour_idx] = max(
                            global_analytics["hourly_history"][current_hour_idx],
                            current_total
                        )
                        
                        if current_total > global_analytics["peak_count"]:
                            global_analytics["peak_count"] = current_total
                            global_analytics["peak_hour"] = time.strftime("%H:00")
                        
                        # Simple total visitors heuristic (accruing)
                        # In a real system, we'd use tracking IDs, but here we'll just 
                        # ensure total_visitors reflects at least the current instantaneous total
                        global_analytics["total_visitors"] = max(global_analytics["total_visitors"], current_total)
                        global_analytics["current_count"] = current_total  # Real-time sync
                        global_analytics["active_cameras"] = len([c for c in cameras.values() if c.enabled])

            else:
                # For MJPEG streams, sometimes read() fails but the stream is still alive
                # We try to grab/retrieve as a fallback
                cap.grab()
                ret_fallback, frame_fallback = cap.retrieve()
                if ret_fallback:
                    with camera_locks.get(camera_id, threading.Lock()):
                        camera_frames[camera_id] = frame_fallback
                else:
                    print(f"[{camera_id}] Stream disconnected")
                    break
            
            # Very small sleep to prevent 100% CPU usage in the capture thread
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

# ============== Health Check ==============

@app.get("/health")
def health_check():
    """Health check endpoint for Docker/HF Spaces"""
    return {
        "status": "healthy",
        "cameras_configured": len(cameras),
        "cameras_active": len([c for c in cameras.values() if c.enabled])
    }


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


# ============== Settings Endpoints ==============

SETTINGS_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "settings.json")

class AppSettings(BaseModel):
    lowBandwidthMode: bool = False
    privacyMaskingEnabled: bool = False
    autoRefreshInterval: int = 2000
    showDensityOverlay: bool = True
    alertSoundEnabled: bool = True
    droidCamUrl: Optional[str] = ""

# Global settings
app_settings: AppSettings = AppSettings()

def load_settings_from_file():
    """Load settings from JSON file"""
    global app_settings
    if os.path.exists(SETTINGS_CONFIG_FILE):
        try:
            with open(SETTINGS_CONFIG_FILE, "r") as f:
                data = json.load(f)
                app_settings = AppSettings(**data)
                print(f"Loaded settings from file")
        except Exception as e:
            print(f"Error loading settings: {e}")

def save_settings_to_file():
    """Save settings to JSON file"""
    try:
        with open(SETTINGS_CONFIG_FILE, "w") as f:
            json.dump(app_settings.model_dump(), f, indent=2)
        print("Settings saved to file")
    except Exception as e:
        print(f"Error saving settings: {e}")

# Load settings on startup
load_settings_from_file()

@app.get("/settings")
def get_settings():
    """Get current application settings"""
    return app_settings.model_dump()

@app.put("/settings")
def update_settings(settings: AppSettings):
    """Update application settings"""
    global app_settings
    app_settings = settings
    save_settings_to_file()
    return {"status": "updated", "settings": app_settings.model_dump()}


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
    """Return image with bounding boxes superimposed from cache"""
    actual_id = camera_id
    if not actual_id and camera_frames:
        actual_id = list(camera_frames.keys())[0]
        
    frame = get_frame_for_camera(actual_id)
    if frame is None:
        return JSONResponse(content={"error": "No frame available"}, status_code=503)

    frame = frame.copy()
    bounding_boxes = camera_detections.get(actual_id, [])

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
    """Return only bounding boxes without the image using cache"""
    # Find actual camera ID
    actual_id = camera_id
    if not actual_id and camera_frames:
        actual_id = list(camera_frames.keys())[0]
        
    if not actual_id or actual_id not in camera_frames:
        return JSONResponse(content={"error": "No frame available"}, status_code=503)

    bounding_boxes = camera_detections.get(actual_id, [])
    
    # Format for response
    formatted_boxes = []
    for det in bounding_boxes:
        formatted_boxes.append({
            "x1": det["x1"], "y1": det["y1"], 
            "x2": det["x2"], "y2": det["y2"],
            "confidence": det.get("conf", 0.0)
        })

    return JSONResponse(
        content={"persons": formatted_boxes, "person_count": len(formatted_boxes)}
    )


@app.get("/analytics")
def analytics(camera_id: Optional[str] = None):
    """Return analytics data including people count and density from cache"""
    actual_id = camera_id
    if not actual_id and camera_frames:
        actual_id = list(camera_frames.keys())[0]
        
    frame = get_frame_for_camera(actual_id)
    if frame is None:
        return JSONResponse(content={"error": "No frame available"}, status_code=503)

    bounding_boxes = camera_detections.get(actual_id, [])
    person_count = len(bounding_boxes)

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
            "camera_id": actual_id or "default",
        }
    )


@app.get("/analytics/global")
def get_global_analytics_endpoint():
    """Return aggregated stats for the entire app dashboard"""
    with analytics_lock:
        data = global_analytics.copy()
        
    # Add status of alerts
    if ALERTS_ENABLED:
        recent_alerts = get_alert_history(10)
        data["recent_alerts"] = [a.model_dump() for a in recent_alerts]
        data["alerts_enabled"] = True
    else:
        data["recent_alerts"] = []
        data["alerts_enabled"] = False
        
    return JSONResponse(content=data)


@app.get("/analytics/all")
def analytics_all():
    """Return aggregated analytics from all cameras using cache"""
    total_count = 0
    camera_analytics = []

    for cid in cameras:
        detections = camera_detections.get(cid, [])
        person_count = len(detections)
        total_count += person_count

        frame = get_frame_for_camera(cid)
        if frame is None:
            camera_analytics.append({
                "camera_id": cid,
                "camera_name": cameras[cid].name,
                "zone": cameras[cid].zone,
                "people_count": 0,
                "density": 0,
                "status": "offline",
            })
            continue

        frame_height, frame_width = frame.shape[:2]
        frame_area = frame_height * frame_width
        max_capacity = frame_area / 10000
        density_percentage = (
            min(100, int((person_count / max_capacity) * 100))
            if max_capacity > 0
            else 0
        )

        camera_analytics.append({
            "camera_id": cid,
            "camera_name": cameras[cid].name,
            "zone": cameras[cid].zone,
            "people_count": person_count,
            "density": density_percentage,
            "status": "online",
        })

    return JSONResponse(
        content={
            "total_people_count": total_count,
            "cameras": camera_analytics,
            "timestamp": time.time(),
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
    """Return lightweight coordinate data for low-bandwidth mode using cached detections"""
    frame = get_frame_for_camera(camera_id)
    if frame is None:
        return JSONResponse(
            content={
                "timestamp": int(time.time() * 1000),
                "people": [], "count": 0, "density": 0,
                "camera_id": camera_id or "default",
                "error": "No frame available"
            },
            status_code=200
        )

    # Use actual camera ID for cache lookup
    actual_id = camera_id
    if not actual_id and camera_frames:
        actual_id = list(camera_frames.keys())[0]
        
    detections = camera_detections.get(actual_id, [])
    
    frame_height, frame_width = frame.shape[:2]
    people = []
    for i, det in enumerate(detections):
        center_x = ((det["x1"] + det["x2"]) / 2) / frame_width * 100
        center_y = ((det["y1"] + det["y2"]) / 2) / frame_height * 100
        zone = get_zone_for_position(center_x, center_y)
        people.append({
            "id": i + 1,
            "x": round(center_x, 1),
            "y": round(center_y, 1),
            "zone": zone,
        })

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
            "camera_id": actual_id or "default",
        }
    )


# ============== Streaming Endpoints ==============


def generate_stream(camera_id: Optional[str] = None):
    """Generator function for MJPEG streaming"""
    print(f"[STREAM] Starting stream for camera_id: {camera_id}")
    while True:
        frame = None
        target_camera = camera_id
        
        # If no camera_id provided, try to pick the first one
        if not target_camera and camera_frames:
            target_camera = list(camera_frames.keys())[0]

        if target_camera and target_camera in camera_frames:
            with camera_locks.get(target_camera, threading.Lock()):
                if camera_frames.get(target_camera) is not None:
                    frame = camera_frames[target_camera].copy()

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
    """Generator function for MJPEG streaming with bounding boxes from cache"""
    print(f"[STREAM-BOXES] Starting stream for camera_id: {camera_id}")
    while True:
        frame = None
        current_cid = camera_id
        
        if not current_cid and camera_frames:
            current_cid = list(camera_frames.keys())[0]

        if current_cid and current_cid in camera_frames:
            with camera_locks.get(current_cid, threading.Lock()):
                if camera_frames.get(current_cid) is not None:
                    frame = camera_frames[current_cid].copy()

        if frame is None:
            time.sleep(0.1)
            continue

        # Use cached detections
        bounding_boxes = camera_detections.get(current_cid, [])
        
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

        # Encode with slightly lower quality for faster streaming
        encode_params = [cv2.IMWRITE_JPEG_QUALITY, 65]
        _, jpeg = cv2.imencode(".jpg", frame, encode_params)

        yield (
            b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpeg.tobytes() + b"\r\n"
        )
        time.sleep(0.04)  # ~25 FPS


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
    """Generator function for MJPEG streaming with privacy masking from cache"""
    while True:
        try:
            frame = None
            current_cid = camera_id
            
            if not current_cid and camera_frames:
                current_cid = list(camera_frames.keys())[0]

            if current_cid and current_cid in camera_frames:
                with camera_locks.get(current_cid, threading.Lock()):
                    if camera_frames.get(current_cid) is not None:
                        frame = camera_frames[current_cid].copy()

            if frame is None:
                time.sleep(0.1)
                continue

            # Use cached detections
            detections = camera_detections.get(current_cid, [])
            
            # Format boxes for masking
            formatted_boxes = []
            for det in detections:
                formatted_boxes.append({
                    "x1": det["x1"], 
                    "y1": det["y1"], 
                    "x2": det["x2"], 
                    "y2": det["y2"]
                })

            frame, _ = blur_upper_body(frame, formatted_boxes)
            frame, _ = blur_faces(frame)

            cv2.putText(
                frame,
                f"Persons: {len(detections)}",
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

            _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 60])

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + jpeg.tobytes() + b"\r\n"
            )
            time.sleep(0.04)
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


# ============== Alert System Endpoints ==============

# Import the alert module
try:
    from twilio_alerts import (
        AlertConfig as TwilioAlertConfig,
        get_alert_config,
        update_alert_config,
        get_alert_history,
        trigger_emergency_alert,
        check_capacity_violation,
        acknowledge_alert,
        send_whatsapp_alert,
    )
    ALERTS_ENABLED = True
except ImportError as e:
    print(f"Alert module not available: {e}")
    ALERTS_ENABLED = False


class EmergencyRequest(BaseModel):
    """Request model for emergency triggers"""
    zone: str = "Unknown"
    reason: str = ""
    camera_id: str = ""


class AlertConfigRequest(BaseModel):
    """Request model for alert configuration"""
    whatsappEnabled: bool = False
    whatsappNumber: str = ""
    alertCooldownMinutes: int = 5
    twilioAccountSid: str = ""
    twilioAuthToken: str = ""
    twilioWhatsappNumber: str = "whatsapp:+14155238886"
    prototypeMode: bool = True
    emergencyContacts: list = []


class CapacityCheckRequest(BaseModel):
    """Request model for zone capacity checks"""
    camera_id: str
    zone: str
    people_count: int
    max_capacity: int


@app.get("/api/alert/config")
def get_alert_configuration():
    """Get current alert configuration"""
    if not ALERTS_ENABLED:
        return {"error": "Alert system not available", "enabled": False}
    
    config = get_alert_config()
    # Don't expose sensitive tokens in response
    return {
        "whatsappEnabled": config.whatsappEnabled,
        "whatsappNumber": config.whatsappNumber,
        "alertCooldownMinutes": config.alertCooldownMinutes,
        "twilioConfigured": bool(config.twilioAccountSid and config.twilioAuthToken),
        "prototypeMode": config.prototypeMode,
        "emergencyContacts": config.emergencyContacts,
        "enabled": True
    }


@app.put("/api/alert/config")
def update_alert_configuration(config: AlertConfigRequest):
    """Update alert configuration"""
    if not ALERTS_ENABLED:
        raise HTTPException(status_code=503, detail="Alert system not available")
    
    new_config = TwilioAlertConfig(
        whatsappEnabled=config.whatsappEnabled,
        whatsappNumber=config.whatsappNumber,
        alertCooldownMinutes=config.alertCooldownMinutes,
        twilioAccountSid=config.twilioAccountSid,
        twilioAuthToken=config.twilioAuthToken,
        twilioWhatsappNumber=config.twilioWhatsappNumber,
        prototypeMode=config.prototypeMode,
        emergencyContacts=config.emergencyContacts
    )
    updated = update_alert_config(new_config)
    return {"status": "updated", "config": {
        "whatsappEnabled": updated.whatsappEnabled,
        "whatsappNumber": updated.whatsappNumber,
        "alertCooldownMinutes": updated.alertCooldownMinutes,
        "prototypeMode": updated.prototypeMode,
    }}


@app.post("/api/alert/emergency")
def trigger_emergency(request: EmergencyRequest):
    """Trigger a manual emergency alert"""
    if not ALERTS_ENABLED:
        raise HTTPException(status_code=503, detail="Alert system not available")
    
    result = trigger_emergency_alert(
        zone=request.zone,
        reason=request.reason or "Manual emergency trigger from CrowdKavach"
    )
    
    return {
        "status": "triggered",
        "result": result,
        "message": "Emergency alert triggered successfully"
    }


@app.post("/api/alert/test")
def test_alert():
    """Send a test alert to verify WhatsApp configuration"""
    if not ALERTS_ENABLED:
        raise HTTPException(status_code=503, detail="Alert system not available")
    
    result = send_whatsapp_alert(
        alert_type="system_error",
        zone="Test Zone",
        reason="This is a test alert from CrowdKavach to verify your WhatsApp configuration."
    )
    
    return {
        "status": "sent" if result.get("success") else "failed",
        "result": result
    }


@app.get("/api/alert/history")
def get_alerts(limit: int = 50):
    """Get recent alert history"""
    if not ALERTS_ENABLED:
        return {"alerts": [], "enabled": False}
    
    alerts = get_alert_history(limit)
    return {
        "alerts": [alert.model_dump() for alert in alerts],
        "count": len(alerts),
        "enabled": True
    }


@app.post("/api/alert/acknowledge/{alert_id}")
def acknowledge_alert_endpoint(alert_id: str):
    """Acknowledge an alert"""
    if not ALERTS_ENABLED:
        raise HTTPException(status_code=503, detail="Alert system not available")
    
    success = acknowledge_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"status": "acknowledged", "alert_id": alert_id}


@app.post("/api/alert/check-capacity")
def check_zone_capacity(request: CapacityCheckRequest):
    """Check if a zone has capacity violation and trigger alert if needed"""
    if not ALERTS_ENABLED:
        return {"checked": False, "enabled": False}
    
    result = check_capacity_violation(
        zone=request.zone,
        camera_id=request.camera_id,
        people_count=request.people_count,
        max_capacity=request.max_capacity
    )
    
    return {
        "checked": True,
        "violation_detected": result is not None,
        "alert_result": result
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

