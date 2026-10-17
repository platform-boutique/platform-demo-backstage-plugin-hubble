import { coreServices, createBackendPlugin } from '@backstage/backend-plugin-api';
import { HubbleClient } from './hubbleClient';
import { createRouter } from './router';

/**
 * Backend of the Hubble / Cilium view: reads flows from Hubble Relay (gRPC) and serves them as JSON.
 *
 *   hubble:
 *     relayAddress: hubble-relay.kube-system.svc.cluster.local:80
 *
 * @public
 */
export const hubblePlugin = createBackendPlugin({
  pluginId: 'hubble',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        lifecycle: coreServices.rootLifecycle,
      },
      async init({ config, httpAuth, httpRouter, logger, lifecycle }) {
        const relay = config.getOptionalString('hubble.relayAddress') ?? 'hubble-relay.kube-system.svc.cluster.local:80';
        const maxFlows = config.getOptionalNumber('hubble.maxFlows') ?? 200;
        const client = new HubbleClient(relay);
        lifecycle.addShutdownHook(() => client.close());
        logger.info(`hubble: reading flows from ${relay}`);
        httpRouter.use(await createRouter({ httpAuth, logger, client, maxFlows }));
        httpRouter.addAuthPolicy({ path: '/health', allow: 'unauthenticated' });
      },
    });
  },
});
