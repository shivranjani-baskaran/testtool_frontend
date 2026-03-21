import axios from 'axios';
import {
  GenerateTestRequest,
  GenerateTestResponse,
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

export const generateTest = async (
  request: GenerateTestRequest
): Promise<GenerateTestResponse> => {
  const response = await apiClient.post<GenerateTestResponse>(
    '/generate-test',
    request
  );
  return response.data;
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
