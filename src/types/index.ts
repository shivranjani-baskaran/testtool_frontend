// API Request/Response types

export interface GenerateTestRequest {
  job_description: string;
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: 'single_choice' | 'code_fill' | 'short_answer' | 'multiple_choice';
  text: string;
  options?: Option[];
  code_snippet?: string;
  placeholder?: string;
  time_limit?: number; // seconds
  category?: string;
  difficulty?: string;
}

export interface GenerateTestResponse {
  questions: Question[];
  role: string;
  skills: string[];
  weights: Record<string, number>;
  test_id?: string;
}

export interface Response {
  question_id: string;
  answer: string;
  time_taken?: number;
  confidence?: 'low' | 'medium' | 'high';
}

export interface ProctorEvent {
  type: 'tab_switch' | 'no_face' | 'multiple_faces' | 'window_blur' | 'copy_paste';
  timestamp: string;
  details?: string;
}

export interface ProctorSummary {
  tab_switches: number;
  no_face_count: number;
  total_events: number;
}

export interface SubmitTestRequest {
  questions: Question[];
  responses: Response[];
  events: ProctorEvent[];
  summary: ProctorSummary;
}

export interface EvaluatedResponse {
  question_id: string;
  question_text: string;
  answer: string;
  score: number;
  max_score: number;
  feedback: string;
  category?: string;
}

export interface MetacognitiveAnalysis {
  confidence_accuracy: number;
  overconfidence_count: number;
  underconfidence_count: number;
  calibration_score: number;
}

export interface CandidateReport {
  total_score: number;
  max_score: number;
  percentage: number;
  grade: string;
  category_scores: Record<string, number>;
  evaluated_responses: EvaluatedResponse[];
  metacognitive_analysis: MetacognitiveAnalysis;
  proctoring_summary: ProctorSummary;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface SubmitTestResponse {
  report: CandidateReport;
  candidate_id?: string;
  submitted_at?: string;
}

// Dashboard types
export interface DashboardMetrics {
  total_candidates: number;
  tests_sent: number;
  tests_completed: number;
  average_score: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface CategoryPerformance {
  name: string;
  value: number;
  color: string;
}

export interface SkillBreakdown {
  skill: string;
  score: number;
  maxScore: number;
}
