# AI Interview Assessment Tool — Frontend

A comprehensive React-based frontend for the AI Interview Assessment tool with full integration to the FastAPI backend.

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API communication
- **React Router v6** for navigation

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Analytics: metric cards, score distribution, category performance, skill breakdown |
| Upload JD | `/upload-jd` | Upload or paste a job description to generate a test |
| Test Taking | `/test` | Interview test interface with timer, proctoring & confidence ratings |
| Reports | `/reports` | Evaluation results, radar chart, metacognitive analysis, proctoring log |

## Getting Started

### Prerequisites

- Node.js 16+
- Running FastAPI backend (see backend repo)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.local.example` to `.env.local` and update the API URL:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
REACT_APP_API_URL=http://localhost:8000
```

### Running

```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
```

## API Integration

The frontend integrates with two FastAPI endpoints:

### `POST /generate-test`

**Request:**
```json
{ "job_description": "..." }
```

**Response:**
```json
{
  "questions": [...],
  "role": "Software Engineer",
  "skills": ["Python", "React"],
  "weights": { "Technical": 60, "Communication": 40 }
}
```

### `POST /submit-test`

**Request:**
```json
{
  "questions": [...],
  "responses": [...],
  "events": [...],
  "summary": { "tab_switches": 0, "no_face_count": 0, "total_events": 0 }
}
```

**Response:**
```json
{
  "report": {
    "total_score": 78,
    "max_score": 100,
    "percentage": 78,
    "grade": "B+",
    "category_scores": {...},
    "evaluated_responses": [...],
    "metacognitive_analysis": {...},
    "proctoring_summary": {...},
    "recommendations": [...],
    "strengths": [...],
    "weaknesses": [...]
  }
}
```

## Running Tests

```bash
npm test
```
