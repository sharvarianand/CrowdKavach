# CrowdKavach 🛡️

**Real-Time Crowd Monitoring & Safety Alert System**

CrowdKavach is an AI-powered crowd monitoring system that uses computer vision to detect crowd density, predict mishaps, and send real-time alerts to security personnel.

🌐 **Live Demo**: [https://crowd-kavach.vercel.app](https://crowd-kavach.vercel.app)

## ✨ Features

- 🎥 **Live Camera Monitoring** - Multi-camera support with MJPEG streaming
- 🤖 **AI-Powered Detection** - YOLOv8 for accurate people counting
- 📊 **Real-Time Analytics** - Live occupancy, peak hours, zone analysis
- 🚨 **Smart Alerts** - WhatsApp notifications for overcrowding & emergencies
- ⚠️ **Mishap Prediction** - Stampede risk warnings when crowd levels are critical
- 🗺️ **Heat Map** - Visual crowd density representation
- 📱 **Emergency Button** - One-click emergency alert system
- 🔐 **Privacy Mode** - Optional face blurring for GDPR compliance
- 📶 **Low Bandwidth Mode** - Data-only view without video streaming for slow connections

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** or **Bun** (recommended)
- **Python 3.10+**
- **DroidCam** (for mobile phone camera prototype)
- Twilio account (for WhatsApp alerts)

### 1. Clone the Repository

```bash
git clone https://github.com/sharvarianand/CrowdKavach.git
cd CrowdKavach
```

### 2. Install Frontend Dependencies

```bash
bun install
# or
npm install
```

### 3. Setup Python Backend

```bash
cd python-server
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Configure Environment

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_PYTHON_SERVER_URL=http://localhost:8000
```

---

## 📱 DroidCam Setup (Prototype)

For prototyping without IP cameras, use your smartphone as a camera:

### Step 1: Install DroidCam

1. Download **DroidCam** app on your phone (Android/iOS)
2. Download **DroidCam Client** on your PC from [dev47apps.com](https://www.dev47apps.com/)

### Step 2: Connect Your Phone

1. Connect phone and PC to the **same WiFi network**
2. Open DroidCam app on phone - note the **WiFi IP** (e.g., `192.168.1.100`)
3. The video URL will be: `http://<phone-ip>:4747/video`

### Step 3: Add Camera in CrowdKavach

1. Start the application
2. Go to **Settings** → **Camera Configuration**
3. Click **Add Camera**
4. Enter:
   - **Name**: Your camera name (e.g., "Main Entrance")
   - **URL**: `http://<phone-ip>:4747/video`
   - **Zone**: Location name
   - **Capacity**: Maximum allowed people (0 = restricted zone)

---

## 📲 WhatsApp Alerts Setup (Twilio)

### Step 1: Create Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Create a free account and verify your phone number

### Step 2: Setup WhatsApp Sandbox

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the sandbox setup instructions
3. Send the join code (e.g., "join hungry-cat") to **+1 415 523 8886** from your WhatsApp

### Step 3: Configure in CrowdKavach

1. Go to **Settings** → **Alert Configuration**
2. Enter:
   - **Your WhatsApp Number**: +91XXXXXXXXXX
   - **Twilio Account SID**: (from Twilio Console)
   - **Twilio Auth Token**: (from Twilio Console)
3. Disable "Prototype Mode"
4. Click **Test Alert** to verify

---

## 🖥️ Running the Application

### Terminal 1: Backend Server

```bash
cd python-server
.\venv\Scripts\activate  # Windows
uvicorn yolo_bounding_boxes:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Frontend

```bash
bun run dev
# or
npm run dev
```

### Access the Application

- **Dashboard**: http://localhost:3001/dashboard
- **Default Passcode**: `231004`

---

## 📁 Project Structure

```
CrowdKavach/
├── app/                    # Next.js pages
├── components/             # React components
│   ├── DashboardUI.tsx     # Main dashboard
│   ├── CameraGrid.tsx      # Live camera feeds
│   ├── HeatMap.tsx         # Crowd heat map
│   └── FloatingEmergencyButton.tsx
├── python-server/          # Python backend
│   ├── yolo_bounding_boxes.py  # Main server
│   ├── twilio_alerts.py    # WhatsApp integration
│   ├── cameras.json        # Camera configuration
│   └── alert_config.json   # Alert settings
└── lib/                    # Shared utilities
```

---

## ⚙️ Configuration

### Camera Settings (`cameras.json`)

```json
{
  "cameras": [
    {
      "id": "cam-1",
      "name": "Main Entrance",
      "url": "http://192.168.1.100:4747/video",
      "zone": "Zone A",
      "enabled": true,
      "capacity": 100
    }
  ]
}
```

### Alert Settings (`alert_config.json`)

```json
{
  "whatsappEnabled": true,
  "whatsappNumber": "+919XXXXXXXXX",
  "alertCooldownMinutes": 5,
  "prototypeMode": false
}
```

---

## 🔔 Alert Types

| Alert | Trigger | Action |
|-------|---------|--------|
| **Overcrowding** | People > Capacity | WhatsApp + Dashboard |
| **Restricted Zone Breach** | People in zone with capacity=0 | WhatsApp + Dashboard |
| **Emergency** | Manual button press | WhatsApp + Dashboard |
| **Mishap Prediction** | Occupancy ≥85% | Warning in alert message |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TailwindCSS
- **Backend**: FastAPI, Python
- **AI/ML**: YOLOv8 (Ultralytics), OpenCV
- **Alerts**: Twilio WhatsApp API
- **Deployment**: Vercel (frontend), Hugging Face Spaces (backend)

---

## 🚀 Cloud Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Set environment variable:
   ```
   NEXT_PUBLIC_PYTHON_SERVER_URL=https://your-hf-space-url.hf.space
   ```
4. Deploy!

### Backend → Hugging Face Spaces

1. Create a new Space at [huggingface.co/spaces](https://huggingface.co/spaces)
2. Choose **Docker** as the SDK
3. Clone your Space repo locally
4. Copy contents of `python-server/` to the Space
5. Rename `HF_README.md` to `README.md`
6. Push to deploy:
   ```bash
   git add .
   git commit -m "Deploy CrowdKavach backend"
   git push
   ```

**Note:** For camera streaming, cameras must be accessible from the HF Space (public IP or tunneled).

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 👥 Contributors

- Sharvari Anand Bhondekar

---

## 🆘 Support

For issues or feature requests, please open a GitHub issue.
