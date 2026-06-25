import io
import logging
import os

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("uvicorn.error")

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "http://localhost:5173")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
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
    allow_methods=["*"],
    allow_headers=["*"],
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
