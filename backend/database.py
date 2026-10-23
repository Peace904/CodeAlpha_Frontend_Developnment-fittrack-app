from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The database will be a file named fittrack.db inside the backend folder
DATABASE_URL = "sqlite:///./fittrack.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Gives each request its own database connection, then closes it
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()