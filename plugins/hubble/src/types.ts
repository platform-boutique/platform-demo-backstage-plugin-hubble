export interface Endpoint {
  namespace?: string;
  pod?: string;
  workload?: string;
  identity?: number;
  names?: string[];
  ip?: string;
}

export interface FlowSummary {
  time: string;
  verdict: string;
  dropReason?: string;
  source: Endpoint;
  destination: Endpoint;
  l4: string;
  l7?: string;
  authType?: string;
  isReply?: boolean;
  observationPoint?: string;
  node?: string;
  summary?: string;
}

export interface FlowsResponse {
  flows: FlowSummary[];
  counts: Record<string, number>;
  relay: string;
}

export interface FlowsQuery {
  namespace?: string;
  workload?: string;
  verdicts?: string[];
  limit?: number;
}
