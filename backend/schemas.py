import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    steps_goal: int
    calories_goal: int
    minutes_goal: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ActivityCreate(BaseModel):
    date: datetime.date
    type: str = Field(min_length=1, max_length=50)
    duration: int = Field(ge=0, le=1440)       # minutes
    steps: int = Field(default=0, ge=0, le=200000)
    calories: int = Field(ge=0, le=20000)


class ActivityOut(ActivityCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int



class GoalsUpdate(BaseModel):
    steps_goal: int = Field(ge=100, le=100000)
    calories_goal: int = Field(ge=50, le=20000)
    minutes_goal: int = Field(ge=5, le=1440)