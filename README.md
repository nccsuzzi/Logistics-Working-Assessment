# AI-Native Logistics Command Center

A fully containerized, full-stack logistics and dispatch platform powered by Groq AI. 

## Features
- **Smart AI Extraction**: Paste an email or text and the AI automatically extracts load details.
- **AI Dispatch Recommendations**: Automatically suggests the best Truck/Driver combinations based on capacity and availability.
- **Logistics Copilot Chatbot**: Ask plain English questions about the fleet and get real-time answers.
- **Full Fleet Management**: Manage Customers, Loads, Trucks, and Drivers in a modern Glassmorphism UI.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Nginx
- **Backend**: FastAPI, Python, SQLAlchemy, SQLite
- **AI**: Groq LPU (GPT-OSS-20B)

## Getting Started (Docker)

We have fully dockerized this repository so any developer can spin it up in seconds without installing Python or Node locally.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Configure Environment
Create a `.env` file in the root of the project and add your Groq API Key:
```env
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=my-super-secret-jwt-key
```

### 2. Run the Application
From the root directory, run:
```bash
docker compose up --build
```

### 3. Access the Platform
- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Development Notes
- The SQLite database is saved as `backend/logistics.db` and is persisted locally.
- The `backend` directory is host-mounted into the Docker container. This means any changes you make to the Python code will instantly hot-reload the backend server!
