from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Daily goals (the user can change them later)
    steps_goal = Column(Integer, default=10000)
    calories_goal = Column(Integer, default=500)
    minutes_goal = Column(Integer, default=45)

    activities = relationship("Activity", back_populates="owner")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    type = Column(String, nullable=False)
    duration = Column(Integer, default=0)
    steps = Column(Integer, default=0)
    calories = Column(Integer, default=0)

    owner = relationship("User", back_populates="activities")
    