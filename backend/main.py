import io
import logging
import os

import anthropic
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger("uvicorn.error")

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "http://localhost:5173")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_ANALYSIS_INPUT = 10000

ALLOWED_CONTENT_TYPES = {
    "text/csv",
    "application/vnd.ms-excel",
    "application/csv",
    "text/plain",
}
REQUIRED_COLUMNS = {"date", "product", "category", "amount"}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    raw = await file.read()
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must not exceed 5MB")

    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception:
        logger.exception("Failed to parse uploaded CSV")
        raise HTTPException(status_code=400, detail="Invalid CSV file")

    if not REQUIRED_COLUMNS.issubset(df.columns):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {', '.join(sorted(REQUIRED_COLUMNS))}",
        )

    df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

    df = df.dropna(subset=["date", "amount"])
    df = df[df["amount"] > 0]

    if df.empty:
        raise HTTPException(status_code=400, detail="No valid rows found in CSV")

    try:
        df["month"] = df["date"].dt.strftime("%Y-%m")

        monthly_sales = (
            df.groupby("month")["amount"]
            .sum()
            .reset_index()
            .rename(columns={"amount": "sales"})
        )
        monthly_sales = monthly_sales.sort_values("month")

        category_sales = (
            df.groupby("category")["amount"]
            .sum()
            .reset_index()
            .rename(columns={"amount": "sales"})
        )

        total = df["amount"].sum()
        category_ratio = category_sales.copy()
        category_ratio["ratio"] = (category_ratio["sales"] / total * 100).round(1)
        category_ratio = category_ratio[["category", "ratio"]]

        kpi = {
            "total": int(total),
            "average": int(df["amount"].mean()),
            "max": int(df["amount"].max()),
            "min": int(df["amount"].min()),
        }

        return {
            "monthly_sales": monthly_sales.to_dict(orient="records"),
            "category_sales": category_sales.to_dict(orient="records"),
            "category_ratio": category_ratio.to_dict(orient="records"),
            "kpi": kpi,
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to process uploaded CSV")
        raise HTTPException(status_code=500, detail="Failed to process file")


class AnalyzeRequest(BaseModel):
    summary: str = Field(..., min_length=1)

    @field_validator("summary")
    @classmethod
    def check_length(cls, v: str) -> str:
        if len(v) > MAX_ANALYSIS_INPUT:
            raise ValueError(
                f"summary must not exceed {MAX_ANALYSIS_INPUT} characters"
            )
        return v


_ANALYZE_SYSTEM = (
    "あなたは優秀なビジネスアナリストです。"
    "提供された売上サマリーをもとに、売上傾向の考察と具体的な施策提案を日本語で行ってください。"
    "回答は「## 売上傾向の考察」と「## 施策提案」の2セクションで構成してください。"
)


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("ANTHROPIC_API_KEY is not configured")
        raise HTTPException(
            status_code=500, detail="AI analysis service is not configured"
        )

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            system=_ANALYZE_SYSTEM,
            messages=[{"role": "user", "content": request.summary}],
        )
        analysis = message.content[0].text
    except anthropic.APIStatusError as e:
        logger.error("Claude API returned status %s", e.status_code)
        raise HTTPException(
            status_code=502, detail="AI analysis service returned an error"
        )
    except anthropic.APIError:
        logger.exception("Claude API request failed")
        raise HTTPException(
            status_code=502, detail="AI analysis service is unavailable"
        )

    return {"analysis": analysis}
