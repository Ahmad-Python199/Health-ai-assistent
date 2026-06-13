# AI Health Symptom Analyzer

A modern Health AI Assistant application featuring a React frontend (Vite) and a FastAPI backend powered by Machine Learning and LLM (OpenRouter) integrations for clinical symptom analysis, emergency detection, and medical translations.

---

## ⚙️ Environment Configuration (`.env` Setup)

To secure API credentials, the `.env` configuration file has been excluded from the repository. Follow these steps to configure your environment variables:

1. Navigate to the `backend/` directory.
2. Create a new file named `.env`.
3. Add the following keys and populate them with your values:

```env
# MongoDB Connection String (Local or Cloud instance)
MONGODB_URL=mongodb://localhost:27017

# MongoDB Database Name
DATABASE_NAME=health_analyzer

# OpenRouter API Key (Required for AI responses and translations)
# Get a key from: https://openrouter.ai/
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Host and Port configurations (Defaults are 0.0.0.0 and 8000)
HOST=0.0.0.0
PORT=8000
```

---

## 🚀 Running the Project

Ensure you have [Node.js](https://nodejs.org/) and [Python 3.8+](https://www.python.org/) installed, and that your local **MongoDB** service is running.

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a Python Virtual Environment (Optional but recommended)
python -m venv venv
# Activate virtual environment:
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload
```
The backend will run on `http://localhost:8000`.

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd ../frontend

# Install node dependencies
npm install

# Start the development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## 🛠️ Verification Tests

To verify that your backend setup, database connection, and API integration are working perfectly, run the backend verification script from the root folder:

```bash
python verify_backend.py
```
