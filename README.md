# 🌟 Jyotish — Vedic Astrology App

A full-stack Vedic astrology web app with birth charts, Kundali matching, and horoscopes.
Powered by sidereal astronomical calculations + Google Gemini AI for interpretations.

---

## 📁 Project Structure

```
astro-app/
├── backend/          ← Node.js + Express (deploy to Railway)
│   ├── index.js
│   ├── routes/
│   │   ├── birthChart.js
│   │   ├── match.js
│   │   └── horoscope.js
│   ├── utils/
│   │   ├── astroCalc.js   ← Astronomical math (no external API)
│   │   └── gemini.js      ← All Gemini AI calls
│   ├── package.json
│   └── .env.example
│
└── frontend/         ← React app (deploy to Vercel/Netlify/Railway)
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js
    │   ├── App.css
    │   ├── api.js
    │   └── components/
    │       ├── BirthChart.js
    │       ├── KundaliMatch.js
    │       └── Horoscope.js
    └── package.json
```

---

## 🔑 Prerequisites

1. **Node.js** v18+ and npm
2. **Gemini API Key** — Get free at: https://aistudio.google.com/app/apikey
3. **Railway account** — https://railway.app (free tier works)

---

## 💻 Local Development

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
npm run dev   # Starts on port 3001
```

### 2. Frontend Setup

```bash
cd frontend
npm install
# No .env needed for local dev (uses proxy to localhost:3001)
npm start     # Starts on port 3000
```

Open http://localhost:3000 in your browser.

---

## 🚂 Deploy Backend to Railway

### Step 1: Push backend to GitHub

```bash
cd backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/astro-backend.git
git push -u origin main
```

### Step 2: Create Railway project

1. Go to https://railway.app and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `astro-backend` repository
4. Railway will detect Node.js and deploy automatically

### Step 3: Set environment variables

In your Railway project dashboard:
1. Click on your service
2. Go to **"Variables"** tab
3. Add:
   ```
   GEMINI_API_KEY = your_actual_gemini_api_key_here
   ```
4. Railway sets `PORT` automatically — do NOT add it manually

### Step 4: Get your Railway URL

After deployment, Railway gives you a URL like:
`https://astro-backend-production-xxxx.up.railway.app`

---

## 🌐 Deploy Frontend to Vercel (Recommended)

### Step 1: Set the backend URL

Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://your-railway-url.up.railway.app
```

### Step 2: Build and deploy

```bash
cd frontend
npm run build
```

Then deploy the `build/` folder to Vercel or Netlify:

**Vercel:**
```bash
npx vercel --prod
```

**Netlify:**
```bash
npx netlify deploy --prod --dir=build
```

Or connect your GitHub repo to Vercel/Netlify for auto-deployments.

---

## 🚂 Alternative: Deploy Both on Railway

You can also serve the React build from the Node.js backend:

1. Build frontend: `cd frontend && npm run build`
2. Copy `frontend/build/` → `backend/public/`
3. Add to `backend/index.js`:
   ```js
   const path = require('path');
   app.use(express.static(path.join(__dirname, 'public')));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'index.html'));
   });
   ```
4. Deploy backend to Railway (it now serves both API + frontend)

---

## 🔌 API Reference

### POST /api/birth-chart
```json
{
  "name": "Arjun Sharma",
  "dob": "1990-04-15",
  "tob": "10:30",
  "lat": 12.971,
  "lon": 77.594
}
```

### POST /api/match
```json
{
  "person1": { "name": "Arjun", "dob": "1990-04-15", "tob": "10:30", "lat": 12.971, "lon": 77.594 },
  "person2": { "name": "Priya", "dob": "1993-08-22", "tob": "07:15", "lat": 19.076, "lon": 72.877 }
}
```

### POST /api/horoscope
```json
{
  "moonSign": "Scorpio",
  "period": "daily"
}
```

---

## 🔒 Security Notes

- ✅ Gemini API key is ONLY in backend `.env`
- ✅ Frontend never calls Gemini directly
- ✅ `process.env.PORT` used (Railway-compatible)
- ✅ `.env` is in `.gitignore` — never committed

---

## 🌙 How It Works

1. **Astronomical Math** (`astroCalc.js`): Calculates sidereal planetary positions using
   simplified VSOP87 theory + Lahiri Ayanamsa conversion. No external astrology API needed.

2. **AI Interpretation** (`gemini.js`): Sends structured chart data to Gemini with
   expert-crafted prompts for Vedic astrology interpretations.

3. **Frontend → Backend → Gemini**: All AI calls are proxied through the backend,
   keeping the API key completely secure.
