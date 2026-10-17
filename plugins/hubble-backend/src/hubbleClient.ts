import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { Endpoint, FlowsQuery, FlowSummary } from './types';

const PROTO_ROOT = path.resolve(__dirname, '..', 'proto');

const definition = protoLoader.loadSync(
  [path.join(PROTO_ROOT, 'observer', 'observer.proto')],
  {
    includeDirs: [PROTO_ROOT],
    keepCase: true,
    longs: Number,
    enums: String,
    defaults: false,
    oneofs: true,
  },
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const observer = (grpc.loadPackageDefinition(definition) as any).observer;

const WORKLOAD_LABEL = 'k8s:app.kubernetes.io/name';

/** Hubble's FlowFilter list: several filters are OR-ed, the fields inside one filter are AND-ed. */
function buildFilters(q: FlowsQuery) {
  const base: Record<string, unknown> = {};
  if (q.verdicts?.length) base.verdict = q.verdicts;
  const ns = q.namespace ? [`${q.namespace}/`] : undefined;
  if (!q.workload) {
    // cluster-wide: restrict to the namespace on either side
    if (!ns) return base.verdict ? [base] : [];
    return [
      { ...base, source_pod: ns },
      { ...base, destination_pod: ns },
    ];
  }
  const label = [`${WORKLOAD_LABEL}=${q.workload}`];
  return [
    { ...base, source_label: label, ...(ns ? { source_pod: ns } : {}) },
    { ...base, destination_label: label, ...(ns ? { destination_pod: ns } : {}) },
  ];
}

function endpoint(e: any, ip?: string, names?: string[]): Endpoint {
  const labels: string[] = e?.labels ?? [];
  const workload = labels
    .find(l => l.startsWith(`${WORKLOAD_LABEL}=`))
    ?.split('=')[1];
  return {
    namespace: e?.namespace || undefined,
    pod: e?.pod_name || undefined,
    workload,
    identity: e?.identity,
    names: names?.length ? names : undefined,
    ip,
  };
}

function l4(f: any): string {
  if (f.l4?.TCP) return `TCP ${f.l4.TCP.destination_port}`;
  if (f.l4?.UDP) return `UDP ${f.l4.UDP.destination_port}`;
  if (f.l4?.ICMPv4) return 'ICMPv4';
  if (f.l4?.ICMPv6) return 'ICMPv6';
  if (f.l4?.SCTP) return `SCTP ${f.l4.SCTP.destination_port}`;
  return '';
}

function l7(f: any): string | undefined {
  const h = f.l7?.http;
  if (h) return `${h.method ?? ''} ${h.url ?? ''} ${h.code ? `→ ${h.code}` : ''}`.trim();
  const d = f.l7?.dns;
  if (d) return `DNS ${d.query ?? ''}`.trim();
  return undefined;
}

function toSummary(f: any): FlowSummary {
  const secs = Number(f.time?.seconds ?? 0);
  const nanos = Number(f.time?.nanos ?? 0);
  const time = new Date(secs * 1000 + Math.floor(nanos / 1e6)).toISOString();
  const authType: string | undefined = f.auth_type;
  return {
    time,
    verdict: f.verdict ?? 'VERDICT_UNKNOWN',
    dropReason: f.drop_reason_desc && f.drop_reason_desc !== 'DROP_REASON_UNKNOWN' ? f.drop_reason_desc : undefined,
    source: endpoint(f.source, f.IP?.source, f.source_names),
    destination: endpoint(f.destination, f.IP?.destination, f.destination_names),
    l4: l4(f),
    l7: l7(f),
    authType: authType && authType !== 'DISABLED' ? authType : undefined,
    isReply: f.is_reply?.value ?? undefined,
    observationPoint: f.traffic_direction ? `${f.traffic_direction}` : undefined,
    node: f.node_name || undefined,
    summary: f.Summary || undefined,
  };
}

export class HubbleClient {
  private readonly client: any;
  constructor(readonly relayAddress: string) {
    this.client = new observer.Observer(relayAddress, grpc.credentials.createInsecure());
  }

  /** Last `limit` flows that match, newest first. Follows nothing: one request, one stream, closed when done. */
  getFlows(q: FlowsQuery, timeoutMs = 8000): Promise<FlowSummary[]> {
    return new Promise((resolve, reject) => {
      const flows: FlowSummary[] = [];
      const call = this.client.GetFlows(
        { number: q.limit, follow: false, whitelist: buildFilters(q) },
        new grpc.Metadata(),
        { deadline: Date.now() + timeoutMs },
      );
      call.on('data', (r: any) => {
        if (r.flow) flows.push(toSummary(r.flow));
      });
      call.on('error', (e: grpc.ServiceError) => {
        // a cancelled/finished stream after data is fine; anything else is the caller's problem
        if (flows.length && e.code === grpc.status.CANCELLED) return resolve(flows.reverse());
        reject(e);
      });
      call.on('end', () => resolve(flows.sort((a, b) => b.time.localeCompare(a.time))));
    });
  }

  serverStatus(): Promise<{ numFlows: number; maxFlows: number; uptimeNs: number; version: string }> {
    return new Promise((resolve, reject) => {
      this.client.ServerStatus({}, (err: grpc.ServiceError | null, r: any) =>
        err
          ? reject(err)
          : resolve({
              numFlows: Number(r.num_flows ?? 0),
              maxFlows: Number(r.max_flows ?? 0),
              uptimeNs: Number(r.uptime_ns ?? 0),
              version: r.version ?? '',
            }),
      );
    });
  }

  close() {
    this.client.close();
  }
}
