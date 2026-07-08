from pydantic import BaseModel, ConfigDict
from app.models.domain import Role

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class UserCreate(BaseModel):
    email: str
    password: str
    role: Role = Role.DISPATCHER

class UserResponse(BaseModel):
    id: int
    email: str
    role: Role
    model_config = ConfigDict(from_attributes=True)
