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

## CSV Format
columns: date / product / category / amount
example: 2024-01-05 / ProductA / Food / 3200

## Notes
- No DB (CSV temp processing only)
- CORS allow localhost:5173