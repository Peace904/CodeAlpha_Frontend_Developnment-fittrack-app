from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import hash_password, verify_password, create_access_token
from deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    email = data.email.lower()

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="This email is already registered")

    user = models.User(
        name=data.name.strip(),
        email=email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.Token)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    email = data.email.lower()
    user = db.query(models.User).filter(models.User.email == email).first()

    # Same message for "no such email" and "wrong password" on purpose,
    # so nobody can use the error to find out which emails exist.
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}



@router.put("/goals", response_model=schemas.UserOut)
def update_goals(
    data: schemas.GoalsUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    user.steps_goal = data.steps_goal
    user.calories_goal = data.calories_goal
    user.minutes_goal = data.minutes_goal
    db.commit()
    db.refresh(user)
    return user