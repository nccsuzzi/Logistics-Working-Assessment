from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai import process_chat_message
from app.models.domain import User

router = APIRouter()

@router.post("/", response_model=ChatResponse)
def chat_with_assistant(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Interact with the Logistics AI Assistant.
    """
    reply = process_chat_message(request.message, db)
    return ChatResponse(reply=reply)
