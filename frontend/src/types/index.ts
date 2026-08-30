export interface DomainItem {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export interface DomainsResponse {
  total_domains: number;
  domains: DomainItem[];
}

export interface PredictionItem {
  domain: string;
  probability: number;
}

export interface DetectDomainResponse {
  domain: string;
  confidence: number;
  top_predictions: PredictionItem[];
  num_chunks_processed: number;
  model_used: string;
  status: string;
}

export interface ConfirmDomainRequest {
  contract_id: string;
  confirmed_domain: string;
  notes?: string;
}

export interface ConfirmDomainResponse {
  status: string;
  contract_id: string;
  active_domain: string;
  is_override: boolean;
}

export type RiskSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type OverallRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskItem {
  title: string;
  severity: RiskSeverity;
  confidence: number;
  semantic_similarity: number;
  nli_confidence: number;
  explanation: string;
  recommendation: string;
  evidence: string;
}

export interface RiskContributionItem {
  title: string;
  severity: RiskSeverity;
  strength: number;
  group: string;
}

export interface AnalyzeRiskResponse {
  status: string;
  sentences_processed: number;
  risks: RiskItem[];
  risk_count: number;
  risk_score: number;
  risk_level: OverallRiskLevel;
  risk_contributions: RiskContributionItem[];
  device: string;
  metadata?: Record<string, any>;
}
