import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/frontend-plugin-api';
import { ResponseError } from '@backstage/errors';
import { FlowsQuery, FlowsResponse } from './types';

export interface HubbleApi {
  getFlows(query: FlowsQuery): Promise<FlowsResponse>;
}

export const hubbleApiRef = createApiRef<HubbleApi>({ id: 'plugin.hubble.service' });

export class HubbleClient implements HubbleApi {
  constructor(private readonly deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {}

  async getFlows(query: FlowsQuery): Promise<FlowsResponse> {
    const base = await this.deps.discoveryApi.getBaseUrl('hubble');
    const params = new URLSearchParams();
    if (query.namespace) params.set('namespace', query.namespace);
    if (query.workload) params.set('workload', query.workload);
    for (const v of query.verdicts ?? []) params.append('verdict', v);
    if (query.limit) params.set('limit', String(query.limit));
    const res = await this.deps.fetchApi.fetch(`${base}/flows?${params}`);
    if (!res.ok) throw await ResponseError.fromResponse(res);
    return res.json();
  }
}
