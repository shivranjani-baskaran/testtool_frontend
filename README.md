# AI Interview Assessment Tool

A full-stack AI-powered interview assessment platform.

## Repository Structure

```
/
├── frontend/        # React + TypeScript frontend
└── backend/         # FastAPI Python backend
```

## Frontend

React 18 + TypeScript application with Tailwind CSS. See [`frontend/`](./frontend/) for setup instructions.

**Quick start:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm start
```

## Backend

FastAPI + SQLAlchemy backend with Azure OpenAI integration. See [`backend/`](./backend/) for setup instructions.

**Quick start:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| AI | Azure OpenAI (GPT-4) |
| Email | Azure Communication Services |

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Analytics: metric cards, score distribution, category performance |
| Upload JD | `/upload-jd` | Upload or paste a job description to generate a test |
| Test Taking | `/test` | Interview test interface with timer, proctoring & confidence ratings |
| Reports | `/reports` | Evaluation results, radar chart, metacognitive analysis |

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
