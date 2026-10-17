import { HttpAuthService, LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { HubbleClient } from './hubbleClient';
import { FlowsResponse } from './types';

const VERDICTS = ['FORWARDED', 'DROPPED', 'ERROR', 'AUDIT', 'REDIRECTED', 'TRACED', 'TRANSLATED'];
const NAME = /^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/;

export interface RouterOptions {
  httpAuth: HttpAuthService;
  logger: LoggerService;
  client: HubbleClient;
  maxFlows: number;
}

export async function createRouter({ httpAuth, logger, client, maxFlows }: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // Only signed-in people; flows name every workload and its peers.
  router.use(async (req, _res, next) => {
    await httpAuth.credentials(req, { allow: ['user'] });
    next();
  });

  router.get('/status', async (_req, res) => {
    res.json({ relay: client.relayAddress, ...(await client.serverStatus()) });
  });

  /**
   * GET /flows?namespace=platform-demo&workload=frontend&verdict=DROPPED&verdict=ERROR&limit=100
   * `workload` is the app.kubernetes.io/name label; flows to AND from it are returned.
   */
  router.get('/flows', async (req, res) => {
    const namespace = req.query.namespace ? String(req.query.namespace) : undefined;
    const workload = req.query.workload ? String(req.query.workload) : undefined;
    const verdicts = ([] as string[]).concat((req.query.verdict as string | string[]) ?? []).map(v => v.toUpperCase());
    if (namespace && !NAME.test(namespace)) throw new InputError('invalid namespace');
    if (workload && !NAME.test(workload)) throw new InputError('invalid workload');
    const bad = verdicts.find(v => !VERDICTS.includes(v));
    if (bad) throw new InputError(`unknown verdict ${bad}; expected one of ${VERDICTS.join(', ')}`);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '100'), 10) || 100, 1), maxFlows);

    const flows = await client.getFlows({ namespace, workload, verdicts, limit });
    const counts: Record<string, number> = {};
    for (const f of flows) counts[f.verdict] = (counts[f.verdict] ?? 0) + 1;
    logger.debug(`hubble: ${flows.length} flows (namespace=${namespace} workload=${workload})`);
    const body: FlowsResponse = { flows, counts, relay: client.relayAddress };
    res.json(body);
  });

  return router;
}
