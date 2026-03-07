"""Dataset management API endpoints"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any, List, Optional, Tuple
import os
import uuid
import csv
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/datasets", tags=["Datasets"])

# In-memory dataset storage (replace with database in production)
datasets_db: Dict[str, Dict[str, Any]] = {}


def _estimate_csv_stats(file_path: str) -> Tuple[int, int]:
    """Estimate samples and features from CSV. Uses streaming for large files."""
    samples, features = 0, 0
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            features = len(header) if header else 0
            # Count rows (limit to 1M for very large files)
            for i, _ in enumerate(reader):
                samples = i + 1
                if samples >= 1_000_000:
                    break
    except Exception:
        pass
    return samples, features


def _get_preview_rows(file_path: str, max_rows: int = 50) -> List[Dict[str, Any]]:
    """Read first N rows as preview."""
    rows: List[Dict[str, Any]] = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            for i, row in enumerate(reader):
                if i >= max_rows:
                    break
                rows.append(dict(row))
    except Exception:
        pass
    return rows


@router.get("/")
async def get_datasets(
    page: int = 1,
    page_size: int = 10,
    q: Optional[str] = None,
    tag: Optional[str] = None,
    status: Optional[str] = None,
) -> Dict[str, Any]:
    """Get datasets with pagination. Returns { total, items } for frontend compatibility."""
    items = list(datasets_db.values())
    # Apply optional filters
    if q:
        ql = q.lower()
        items = [d for d in items if ql in (d.get("name") or "").lower() or ql in (d.get("description") or "").lower()]
    if tag:
        tags = [str(t).lower() for t in (tag.split(",") if isinstance(tag, str) else [tag])]
        items = [d for d in items if any(t in (d.get("tags") or []) for t in tags)]
    if status:
        items = [d for d in items if (d.get("status") or "").lower() == status.lower()]
    total = len(items)
    # Paginate
    start = (page - 1) * page_size
    end = start + page_size
    items = items[start:end]
    # Ensure each item has required fields for frontend
    for d in items:
        d.setdefault("samples", 0)
        d.setdefault("features", 0)
        d.setdefault("quality_score", 80)
        d.setdefault("fl_suitability", 75)
        d.setdefault("privacy_level", "private")
        d.setdefault("tags", [])
        d.setdefault("owner", "system")
        if d.get("status") == "active":
            d["status"] = "ready"
    return {"total": total, "items": items}


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
) -> Dict[str, Any]:
    """Upload a new dataset. Accepts optional metadata (name, description, tags)."""
    try:
        os.makedirs("data/datasets", exist_ok=True)

        file_id = str(uuid.uuid4())
        ext = file.filename.split(".")[-1] if "." in (file.filename or "") else "csv"
        filename = f"{file_id}.{ext}"
        file_path = os.path.join("data", "datasets", filename)

        # Stream write to avoid loading entire file in memory for large files
        size_bytes = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                buffer.write(chunk)
                size_bytes += len(chunk)

        # Estimate samples and features (async-friendly, runs after save)
        samples, features = _estimate_csv_stats(file_path)

        tag_list = []
        if tags:
            tag_list = [t.strip() for t in str(tags).split(",") if t.strip()]

        dataset = {
            "id": file_id,
            "name": (name or file.filename or filename).strip(),
            "description": (description or f"Uploaded: {file.filename}").strip(),
            "size_mb": round(size_bytes / (1024 * 1024), 2),
            "size_bytes": size_bytes,
            "samples": samples,
            "features": features,
            "quality_score": min(100, 70 + (features // 5)),
            "fl_suitability": min(100, 60 + (samples // 1000)),
            "privacy_level": "private",
            "tags": tag_list,
            "owner": "system",
            "upload_date": datetime.now(timezone.utc).isoformat(),
            "status": "ready",
            "file_path": file_path,
        }
        datasets_db[file_id] = dataset

        logger.info("Dataset uploaded", dataset_id=file_id, filename=file.filename)
        return dataset

    except Exception as e:
        logger.error("Dataset upload failed", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{dataset_id}/preview")
async def preview_dataset(dataset_id: str) -> Dict[str, Any]:
    """Get preview rows for a dataset."""
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    ds = datasets_db[dataset_id]
    fp = ds.get("file_path")
    if not fp or not os.path.exists(fp):
        raise HTTPException(status_code=404, detail="Dataset file not found")
    rows = _get_preview_rows(fp)
    return {"rows": rows}


@router.get("/{dataset_id}/download")
async def download_dataset(dataset_id: str):
    """Download dataset file."""
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    ds = datasets_db[dataset_id]
    fp = ds.get("file_path")
    if not fp or not os.path.exists(fp):
        raise HTTPException(status_code=404, detail="Dataset file not found")
    name = ds.get("name") or "dataset.csv"
    if not name.endswith(".csv") and not name.endswith(".json"):
        name = name + ".csv"
    return FileResponse(fp, filename=name, media_type="text/csv")


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str) -> Dict[str, Any]:
    """Delete a dataset"""
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")

    dataset = datasets_db[dataset_id]
    fp = dataset.get("file_path")
    if fp and os.path.exists(fp):
        os.remove(fp)
    del datasets_db[dataset_id]
    logger.info("Dataset deleted", dataset_id=dataset_id)
    return {"message": "Dataset deleted successfully"}
