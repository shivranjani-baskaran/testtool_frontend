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
  [key: string]: unknown;
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
/** Extract the display text from a raw option object, trying all known field names. */
const extractOptionText = (opt: RawOption, i: number): string => {
  const knownIdKeys = ['id', 'option_id', 'key'];
  if (opt.text) return opt.text;
  if (opt.option_text) return opt.option_text;
  if (opt.value) return opt.value;
  // Fall back to single non-id key value (e.g. {"A": "text"})
  const extra = Object.keys(opt).filter((k) => !knownIdKeys.includes(k));
  if (extra.length === 1) return String(opt[extra[0]] ?? '');
  return String.fromCharCode(65 + i); // absolute last resort: A, B, C…
};

const normalizeQuestion = (raw: RawQuestion, index: number): Question => {
  const id = String(raw.id ?? raw.question_id ?? index + 1);
  const text = raw.text ?? raw.question_text ?? raw.question ?? '';
  const type = (raw.type ?? raw.question_type ?? 'single_choice') as Question['type'];

  let options: Option[] | undefined;
  if (Array.isArray(raw.options) && raw.options.length > 0) {
    options = raw.options.map((opt: RawOption, i: number) => {
      const label = String(opt.id ?? opt.option_id ?? opt.key ?? String.fromCharCode(65 + i));
      return { id: label, text: extractOptionText(opt, i) };
    });
  } else if (raw.options && !Array.isArray(raw.options) && typeof raw.options === 'object') {
    // Backend may return options as a dict: {"A": "text1", "B": "text2"}
    const optDict = raw.options as Record<string, unknown>;
    options = Object.entries(optDict).map(([key, val]) => ({
      id: key,
      text: String(val ?? ''),
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

export const generateTestLink = async (request: {
  candidate_id: string;
  email: string;
  name?: string;
  questions: Question[];
  session_id?: string;
}): Promise<{ session_id: string; test_link: string; message: string }> => {
  const response = await apiClient.post('/generate-test-link', request);
  return response.data;
};

export default apiClient;
