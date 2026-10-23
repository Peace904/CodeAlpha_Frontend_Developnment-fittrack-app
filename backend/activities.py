import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from deps import get_current_user

router = APIRouter(prefix="/activities", tags=["activities"])


@router.post("", response_model=schemas.ActivityOut, status_code=status.HTTP_201_CREATED)
def add_activity(
    data: schemas.ActivityCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    activity = models.Activity(user_id=user.id, **data.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("", response_model=List[schemas.ActivityOut])
def list_activities(
    start: Optional[datetime.date] = None,
    end: Optional[datetime.date] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = db.query(models.Activity).filter(models.Activity.user_id == user.id)
    if start:
        query = query.filter(models.Activity.date >= start)
    if end:
        query = query.filter(models.Activity.date <= end)
    return query.order_by(models.Activity.date.desc(), models.Activity.id.desc()).all()


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    activity = (
        db.query(models.Activity)
        .filter(models.Activity.id == activity_id, models.Activity.user_id == user.id)
        .first()
    )
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    db.delete(activity)
    db.commit()