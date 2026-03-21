# AI Assessment Tool - Backend

FastAPI backend for the AI-powered interview assessment platform.

## Structure

```
backend/
├── config/          # Settings and database configuration
├── database/        # SQLAlchemy models and Pydantic schemas
├── services/        # Business logic (email, candidate, test, storage)
├── routes/          # FastAPI route handlers
├── agents/          # AI agents (LangGraph workflows + individual agents)
├── tests/           # Unit tests
├── main.py          # FastAPI application entry point
├── requirements.txt
└── .env.example
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure OpenAI, Email, and PostgreSQL credentials
   ```

3. **Run the server:**
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /generate-test | Generate questions from JD |
| POST | /generate-test-link | Create session and send email |
| POST | /submit-test | Submit answers and get report |
| GET | /test-session/{id} | Get test session data |
| POST | /validate-session | Validate session credentials |
| GET | /candidate/{id} | Get candidate info |
| GET | /candidate/{id}/report | Get evaluation report |

## Data Flow

1. Admin uploads JD → `POST /generate-test` → questions returned
2. Admin enters candidate email → `POST /generate-test-link` → session created, email sent
3. Candidate opens link (session_id + password) → `POST /validate-session` → access granted
4. Candidate answers questions → `POST /submit-test` → report returned
