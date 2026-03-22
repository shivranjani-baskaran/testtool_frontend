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
  jd_id?: string;
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
  candidate_id: string;
  email: string;
  session_id?: string;
  questions: Question[];
  responses: Response[];
  total_time: number;
  test_metadata: {
    start_time: string;
    end_time: string;
    tab_switches: number;
    copy_paste_attempts: number;
    window_blur_count?: number;
  };
  // Legacy proctoring fields kept for backwards compatibility
  events?: ProctorEvent[];
  summary?: ProctorSummary;
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
  guessing_count?: number;
  struggle_count?: number;
  meta_score?: number;
  behavioral_insights?: string[];
}

export interface CandidateReport {
  total_score: number;
  max_score: number;
  percentage: number;
  final_score: number;
  grade: string;
  hire_decision: string;
  risk_level: string;
  summary: string;
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

export interface CandidateInfo {
  candidate_id: string;
  email: string;
  name?: string;
  session_id?: string;
}

export interface GenerateTestLinkResponse {
  session_id: string;
  test_link: string;
  message: string;
}

// Dashboard types
export interface DashboardMetrics {
  total_candidates: number;
  tests_sent: number;
  tests_completed: number;
  average_score: number;
  score_distribution: { range: string; count: number }[];
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

export interface JobDescriptionRecord {
  id: string;
  raw_text: string;
  role?: string;
  skills?: string[];
  weights?: Record<string, number>;
  seniority_level?: string;
  questions?: Question[];
  created_at: string;
}

export interface CandidateReportSummary {
  candidate_id: string;
  name?: string;
  email: string;
  session_id: string;
  role?: string;
  final_score?: number;
  hire_decision?: string;
  risk_level?: string;
  completed_at?: string;
}
