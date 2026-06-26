# Sales Dashboard

## Project Overview
Upload CSV to visualize sales data.

## Tech Stack
- Frontend: React + Recharts
- Backend: FastAPI + pandas
- Deploy: Render

## Directory Structure
sales-dashboard/
├── CLAUDE.md
├── frontend/
└── backend/

## Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

## Frontend
cd frontend
npm install
npm run dev

## API
- POST /upload-csv : Receive CSV, return JSON
- POST /analyze : Receive sales summary text, return AI analysis in Japanese

### /analyze endpoint
- Request body (JSON): `{ "summary": "<sales summary text>" }`
- Max input length: 10,000 characters (`MAX_ANALYSIS_INPUT`)
- Response: `{ "analysis": "<AI generated analysis>" }`
- Requires `ANTHROPIC_API_KEY` env var (500 if missing)
- Uses model `claude-opus-4-6` via anthropic SDK
- Claude API errors return 502

## CSV Format
columns: date / product / category / amount
example: 2024-01-05 / ProductA / Food / 3200

## Notes
- No DB (CSV temp processing only)
- CORS allow localhost:5173