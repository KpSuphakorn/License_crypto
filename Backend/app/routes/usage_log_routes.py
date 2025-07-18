from fastapi import APIRouter, HTTPException, Depends, Request
from app.dependencies.auth import require_admin
from app.models.usage_log_model import get_usage_log_collection
from app.schemas.usage_log_schema import UsageLog
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse
import csv
import io
from typing import Optional

router = APIRouter(prefix="/usage-logs", tags=["Usage Logs"])

def log_usage(user_id: str, user_name: str, license_id: str, license_no: str, action: str, 
              duration_seconds: Optional[int] = None, ip_address: Optional[str] = None, 
              user_agent: Optional[str] = None):
    """Helper function to log usage events"""
    try:
        log_collection = get_usage_log_collection()
        log_data = {
            "user_id": user_id,
            "user_name": user_name,
            "license_id": license_id,
            "license_no": license_no,
            "action": action,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "duration_seconds": duration_seconds,
            "ip_address": ip_address,
            "user_agent": user_agent
        }
        log_collection.insert_one(log_data)
    except Exception as e:
        print(f"Error logging usage: {e}")

@router.get("/", dependencies=[Depends(require_admin)])
def get_usage_logs(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: Optional[str] = None,
    license_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get usage logs with optional filtering (admin only)"""
    log_collection = get_usage_log_collection()
    
    # Build query filter
    query = {}
    
    if start_date:
        query["timestamp"] = {"$gte": start_date}
    if end_date:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = end_date
        else:
            query["timestamp"] = {"$lte": end_date}
    
    if user_id:
        query["user_id"] = user_id
    if license_id:
        query["license_id"] = license_id
    if action:
        query["action"] = action
    
    # Get logs
    logs = list(log_collection.find(query).sort("timestamp", -1).skip(skip).limit(limit))
    
    # Convert ObjectId to string
    for log in logs:
        log["_id"] = str(log["_id"])
    
    # Get total count
    total_count = log_collection.count_documents(query)
    
    return {
        "logs": logs,
        "total_count": total_count,
        "limit": limit,
        "skip": skip
    }

@router.get("/download", dependencies=[Depends(require_admin)])
def download_usage_logs(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: Optional[str] = None,
    license_id: Optional[str] = None,
    action: Optional[str] = None
):
    """Download usage logs as CSV (admin only)"""
    log_collection = get_usage_log_collection()
    
    # Build query filter
    query = {}
    
    if start_date:
        query["timestamp"] = {"$gte": start_date}
    if end_date:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = end_date
        else:
            query["timestamp"] = {"$lte": end_date}
    
    if user_id:
        query["user_id"] = user_id
    if license_id:
        query["license_id"] = license_id
    if action:
        query["action"] = action
    
    # Get logs
    logs = list(log_collection.find(query).sort("timestamp", -1))
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'timestamp', 'user_id', 'user_name', 'license_id', 'license_no', 
        'action', 'duration_seconds', 'ip_address', 'user_agent'
    ])
    
    writer.writeheader()
    for log in logs:
        # Remove _id field and write row
        log.pop('_id', None)
        writer.writerow(log)
    
    # Create response
    output.seek(0)
    
    # Generate filename with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"usage_logs_{timestamp}.csv"
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/stats", dependencies=[Depends(require_admin)])
def get_usage_stats():
    """Get usage statistics (admin only)"""
    log_collection = get_usage_log_collection()
    
    # Get stats for the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    thirty_days_ago_str = thirty_days_ago.isoformat() + "Z"
    
    pipeline = [
        {"$match": {"timestamp": {"$gte": thirty_days_ago_str}}},
        {"$group": {
            "_id": "$action",
            "count": {"$sum": 1}
        }}
    ]
    
    action_stats = list(log_collection.aggregate(pipeline))
    
    # Get user stats
    user_pipeline = [
        {"$match": {"timestamp": {"$gte": thirty_days_ago_str}}},
        {"$group": {
            "_id": "$user_id",
            "user_name": {"$first": "$user_name"},
            "total_actions": {"$sum": 1},
            "total_duration": {"$sum": "$duration_seconds"}
        }},
        {"$sort": {"total_actions": -1}},
        {"$limit": 10}
    ]
    
    user_stats = list(log_collection.aggregate(user_pipeline))
    
    return {
        "action_stats": action_stats,
        "top_users": user_stats,
        "period": "Last 30 days"
    }
