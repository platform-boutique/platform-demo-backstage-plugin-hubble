/** A flow as the portal needs it: the Hubble `Flow` message reduced to what a person reads. */
export interface Endpoint {
  namespace?: string;
  pod?: string;
  /** app.kubernetes.io/name label: what Cilium (and our Kyverno policies) call the identity of a workload */
  workload?: string;
  /** Cilium security identity number */
  identity?: number;
  /** Fully qualified names for traffic that leaves the cluster */
  names?: string[];
  ip?: string;
}

export interface FlowSummary {
  time: string;
  verdict: string;
  dropReason?: string;
  source: Endpoint;
  destination: Endpoint;
  /** "TCP 8080", "UDP 53", "ICMPv4" ... */
  l4: string;
  /** one-line description of the application protocol where Hubble saw it (HTTP, DNS, Kafka) */
  l7?: string;
  /** NONE | DISABLED | SPIRE | ... : whether the connection needed and got mutual authentication */
  authType?: string;
  isReply?: boolean;
  /** where on the path the flow was observed (to-endpoint, from-proxy ...) */
  observationPoint?: string;
  node?: string;
  summary?: string;
}

export interface FlowsResponse {
  flows: FlowSummary[];
  /** number of flows by verdict in this response */
  counts: Record<string, number>;
  relay: string;
}

export interface FlowsQuery {
  namespace?: string;
  /** value of the app.kubernetes.io/name label; matches flows where the workload is source OR destination */
  workload?: string;
  verdicts?: string[];
  limit: number;
}
