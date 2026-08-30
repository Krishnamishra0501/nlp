import axios from 'axios';
import {
  DomainsResponse,
  DetectDomainResponse,
  ConfirmDomainRequest,
  ConfirmDomainResponse,
  AnalyzeRiskResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

export const fetchDomains = async (): Promise<DomainsResponse> => {
  const response = await api.get<DomainsResponse>('/api/v1/domains');
  return response.data;
};

export const detectDomain = async (
  file: File | null,
  text: string | null,
  useBaseline: boolean = false,
  useChunkAggregation: boolean = true
): Promise<DetectDomainResponse> => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (text) {
    formData.append('text', text);
  }
  formData.append('use_baseline', String(useBaseline));
  formData.append('use_chunk_aggregation', String(useChunkAggregation));

  const response = await api.post<DetectDomainResponse>(
    '/api/v1/detect-domain',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const confirmDomain = async (
  data: ConfirmDomainRequest
): Promise<ConfirmDomainResponse> => {
  const response = await api.post<ConfirmDomainResponse>(
    '/api/v1/confirm-domain',
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export const analyzeRisk = async (
  file: File | null,
  text: string | null
): Promise<AnalyzeRiskResponse> => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (text) {
    formData.append('text', text);
  }

  const response = await api.post<AnalyzeRiskResponse>(
    '/api/v1/analyze-risk',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};
