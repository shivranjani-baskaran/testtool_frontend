import axios from 'axios';
import {
  GenerateTestRequest,
  GenerateTestResponse,
  Question,
  Option,
  SubmitTestRequest,
  SubmitTestResponse,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[API Error]', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[API Error] No response received:', error.message);
    } else {
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

// Raw response shapes returned by the backend (field names may vary by backend version)
interface RawOption {
  id?: string | number;
  option_id?: string | number;
  key?: string | number;
  text?: string;
  option_text?: string;
  value?: string;
}

interface RawQuestion {
  id?: string | number;
  question_id?: string | number;
  text?: string;
  question_text?: string;
  question?: string;
  type?: string;
  question_type?: string;
  options?: RawOption[];
  code_snippet?: string;
  code?: string;
  placeholder?: string;
  time_limit?: number;
  time?: number;
  category?: string;
  skill?: string;
  difficulty?: string;
}

interface RawGenerateTestResponse {
  questions?: RawQuestion[];
  role?: string;
  job_title?: string;
  skills?: string[];
  weights?: Record<string, number>;
  test_id?: string;
  [key: string]: unknown;
}

/**
 * Normalize a raw question object from the backend into the frontend Question shape.
 * Backends may use different field names (e.g. question_text vs text, question_type vs type,
 * option_id/option_text vs id/text, numeric IDs, etc.).
 */
const normalizeQuestion = (raw: RawQuestion, index: number): Question => {
  const id = String(raw.id ?? raw.question_id ?? index + 1);
  const text = raw.text ?? raw.question_text ?? raw.question ?? '';
  const type = (raw.type ?? raw.question_type ?? 'single_choice') as Question['type'];

  let options: Option[] | undefined;
  if (Array.isArray(raw.options) && raw.options.length > 0) {
    options = raw.options.map((opt: RawOption, i: number) => ({
      id: String(opt.id ?? opt.option_id ?? opt.key ?? String.fromCharCode(65 + i)),
      text: opt.text ?? opt.option_text ?? opt.value ?? '',
    }));
  }

  return {
    id,
    text,
    type,
    options,
    code_snippet: raw.code_snippet ?? raw.code ?? undefined,
    placeholder: raw.placeholder ?? undefined,
    time_limit: raw.time_limit ?? raw.time ?? undefined,
    category: raw.category ?? raw.skill ?? undefined,
    difficulty: raw.difficulty ?? undefined,
  };
};

/**
 * Normalize the full /generate-test response.
 */
const normalizeGenerateTestResponse = (raw: RawGenerateTestResponse): GenerateTestResponse => {
  const questions: Question[] = Array.isArray(raw.questions)
    ? raw.questions.map(normalizeQuestion)
    : [];

  return {
    questions,
    role: raw.role ?? raw.job_title ?? '',
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    weights: raw.weights ?? {},
    test_id: raw.test_id ?? undefined,
  };
};

export const generateTest = async (
  request: GenerateTestRequest
): Promise<GenerateTestResponse> => {
  const response = await apiClient.post<RawGenerateTestResponse>('/generate-test', request);
  return normalizeGenerateTestResponse(response.data);
};

export const submitTest = async (
  request: SubmitTestRequest
): Promise<SubmitTestResponse> => {
  const response = await apiClient.post<SubmitTestResponse>(
    '/submit-test',
    request
  );
  return response.data;
};

export default apiClient;
