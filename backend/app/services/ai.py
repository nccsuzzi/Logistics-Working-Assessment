import json
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

class ExtractedLoadData(BaseModel):
    pickup_location: Optional[str] = Field(None, description="The city, state, or address for pickup.")
    delivery_location: Optional[str] = Field(None, description="The city, state, or address for delivery.")
    weight: Optional[float] = Field(None, description="The weight of the load in lbs. Return just the numeric value.")
    commodity: Optional[str] = Field(None, description="The type of goods being shipped.")
    pickup_date: Optional[str] = Field(None, description="The date and time for pickup, in ISO 8601 format.")
    delivery_deadline: Optional[str] = Field(None, description="The deadline for delivery, in ISO 8601 format.")
    budget: Optional[float] = Field(None, description="The proposed budget for the shipment. Return just the numeric value.")
    ai_summary: Optional[str] = Field(None, description="A 1-2 sentence auto-generated summary of this shipment (e.g. 'Transporting 18,500 lbs of fresh produce from Dallas to Houston').")
    validation_warnings: List[str] = Field(
        default_factory=list,
        description="A list of specific warnings if there are conflicting dates, unrealistic deadlines (e.g. 1000 miles in 2 hours), missing crucial info, or capacity issues."
    )

def extract_load_from_text(text: str) -> dict:
    """
    Extracts structured load data from free-form text using Groq's tool calling.
    """
    system_prompt = f"""You are an expert AI logistics dispatcher.
Your task is to extract structured shipment data from a free-form email or message and validate it.
Current date and time for reference: {datetime.utcnow().isoformat()}

Rules:
1. Extract all available shipment details.
2. If any information is missing, leave the field null.
3. CAREFULLY review the extracted info and populate the `validation_warnings` array. Think critically like a dispatcher:
   - Is the weight missing? Add a warning.
   - Are the locations ambiguous?
   - Is the distance between pickup and delivery physically impossible to drive within the requested time frame?
"""

    tools = [
        {
            "type": "function",
            "function": {
                "name": "extract_load_details",
                "description": "Extract load details and generate validation warnings.",
                "parameters": ExtractedLoadData.model_json_schema()
            }
        }
    ]

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            tools=tools,
            tool_choice={"type": "function", "function": {"name": "extract_load_details"}}
        )
        
        tool_call = response.choices[0].message.tool_calls[0]
        arguments = json.loads(tool_call.function.arguments)
        return arguments
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Fallback or error handling
        return {"error": str(e), "validation_warnings": ["Failed to extract data using AI."]}

def get_dispatch_recommendations(load_dict: dict, trucks: list, drivers: list) -> dict:
    """
    Asks the AI to recommend the best truck/driver combinations for a specific load.
    """
    system_prompt = f"""You are an expert logistics AI.
You need to recommend the best truck and driver combinations for the given load.
Consider capacity, current locations, and availability.
Current time: {datetime.utcnow().isoformat()}

Rules:
1. Provide a ranked list of up to 3 recommendations.
2. Explain exactly why each recommendation was made.
3. If a recommendation has potential conflicts (like tight schedule, capacity near limit, or locations being far apart), note it in `warning_conflict`."""

    tools = [
        {
            "type": "function",
            "function": {
                "name": "provide_recommendations",
                "description": "Provide a ranked list of dispatch recommendations.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "recommendations": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "truck_id": {"type": "integer"},
                                    "driver_id": {"type": "integer"},
                                    "reasoning": {"type": "string", "description": "Why this combination is good."},
                                    "warning_conflict": {"type": ["string", "null"], "description": "Any potential conflicts or null if perfect."}
                                },
                                "required": ["truck_id", "driver_id", "reasoning"]
                            }
                        }
                    },
                    "required": ["recommendations"]
                }
            }
        }
    ]

    content = f"Load Details: {json.dumps(load_dict)}\n\nAvailable Trucks: {json.dumps(trucks)}\n\nAvailable Drivers: {json.dumps(drivers)}"

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content}
            ],
            tools=tools,
            tool_choice={"type": "function", "function": {"name": "provide_recommendations"}}
        )
        
        tool_call = response.choices[0].message.tool_calls[0]
        arguments = json.loads(tool_call.function.arguments)
        return arguments
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"recommendations": []}

from sqlalchemy.orm import Session
from app.models.domain import Truck, Driver, Load, TruckStatus, DriverStatus, LoadStatus
import datetime as dt

def process_chat_message(user_message: str, db: Session) -> str:
    """
    An agentic loop that allows the LLM to query the database using tools before answering.
    """
    system_prompt = f"""You are LogisticsCopilot, a highly intelligent Logistics AI Assistant.
You help dispatchers by answering questions about the fleet and loads.
Current time: {dt.datetime.utcnow().isoformat()}

You have access to tools. If the user asks about trucks, drivers, or loads, USE THE TOOLS to fetch the real-time data first.
DO NOT guess. Only answer based on the data returned by the tools.
Be concise and professional."""

    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_fleet_summary",
                "description": "Get a summary of all trucks and drivers and their current statuses (e.g. how many are idle vs assigned)."
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_active_loads",
                "description": "Get a list of all active (Pending, Assigned, In Transit) loads and their deadlines."
            }
        }
    ]

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        
        msg = response.choices[0].message
        
        # If no tool was called, return the direct response
        if not msg.tool_calls:
            return msg.content or "I couldn't process that request."
            
        # The AI wants to call a tool
        messages.append(msg) # Append the assistant's tool call message
        
        for tool_call in msg.tool_calls:
            tool_name = tool_call.function.name
            tool_content = ""
            
            if tool_name == "get_fleet_summary":
                idle_trucks = db.query(Truck).filter(Truck.status == TruckStatus.AVAILABLE).count()
                assigned_trucks = db.query(Truck).filter(Truck.status == TruckStatus.ASSIGNED).count()
                idle_drivers = db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).count()
                tool_content = json.dumps({
                    "idle_trucks": idle_trucks,
                    "assigned_trucks": assigned_trucks,
                    "idle_drivers": idle_drivers
                })
            elif tool_name == "get_active_loads":
                active_loads = db.query(Load).filter(Load.status != LoadStatus.DELIVERED).all()
                loads_data = [{"id": l.id, "status": l.status, "deadline": str(l.delivery_deadline)} for l in active_loads]
                tool_content = json.dumps(loads_data)
            else:
                tool_content = json.dumps({"error": "Unknown tool"})
                
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": tool_name,
                "content": tool_content
            })
            
        # Second call to LLM with the tool results so it can synthesize the final answer
        final_response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=messages
        )
        return final_response.choices[0].message.content or "Error generating response."
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return "I encountered an error while processing your request. Please try again."
