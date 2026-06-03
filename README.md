# Curriculum Program Builder

A full-stack application for building and managing university curriculum programs, allowing users to create, edit, and compare academic paths with Excel import/export capabilities.

## 🚀 Quick Start

### Local Development

#### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
# Set your Gemini API Key in .env or environment variables
# GEMINI_API_KEY=your_key_here
python main.py
```
*Runs on `http://127.0.0.1:8000`*

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`*

**Login Credentials:**
- **Username:** `Admin`
- **Password:** `12345`

---

## 🌐 Public Deployment (Demo Link)

This project is configured for easy deployment to **Render** (Backend) and **Vercel** (Frontend).

### 1. Deploy Backend to Render.com
1. Create a **Web Service** on Render.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variable**:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Google AI Studio API Key.
5. Copy your backend URL (e.g., `https://api-xxx.onrender.com`).

### 2. Deploy Frontend to Vercel
1. Import your project to Vercel.
2. Add an **Environment Variable**:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** Your Render backend URL.
3. Deploy!

---

## 🛠 Features
- **User Authentication:** Secure login for admin and students.
- **Course Management:** Add, edit, and search courses.
- **Study Plan Creator:** Drag-and-drop or manual assignment of courses to semesters.
- **Excel Integration:** Import plans from Excel templates and export results.
- **Plan Comparison:** Compare two different study plans side-by-side.
- **AI Alignment Tool:** Use **Google Gemini** to automatically suggest equivalencies between two plans.
- **Bilingual Support:** Full Arabic and English interface.

---

## 📁 Project Structure
- `backend/`: FastAPI application, SQLite database, and Excel utilities.
- `frontend/`: React + Vite + TailwindCSS frontend application.
- `README.md`: Project documentation and guides.

---

## 🔧 Troubleshooting
- **AI Alignment:** Requires a valid `GEMINI_API_KEY`. Get one at [Google AI Studio](https://aistudio.google.com/).
- **CORS Errors:** The backend is configured to allow all origins for the demo.
- **Database:** Uses SQLite by default. Data persists in `backend/study_plan.db`.
- **API Connection:** Ensure `VITE_API_BASE_URL` is set correctly in production.

---

## 📄 License
This project is for academic purposes.
