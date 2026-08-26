from sqlalchemy import Column, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, index=True)  # officer / supervisor / admin
    region_scope = Column(String(255), nullable=True)
