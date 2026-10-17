import {
  ApiBlueprint,
  PageBlueprint,
  createFrontendPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/frontend-plugin-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { hubbleApiRef, HubbleClient } from './api';
import { rootRouteRef } from './routes';

const hubbleApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams({
      api: hubbleApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: deps => new HubbleClient(deps),
    }),
});

/** Tab "Network" on every entity that has a Kubernetes selector (i.e. everything that runs in the cluster). */
const entityNetworkContent = EntityContentBlueprint.make({
  name: 'network',
  params: {
    path: '/network',
    title: 'Network',
    filter: entity =>
      Boolean(
        entity.metadata.annotations?.['backstage.io/kubernetes-label-selector'] ||
          entity.metadata.annotations?.['backstage.io/kubernetes-id'],
      ),
    loader: () => import('./components/EntityNetworkContent').then(m => <m.EntityNetworkContent />),
  },
});

const networkPage = PageBlueprint.make({
  params: {
    path: '/network',
    title: 'Network',
    routeRef: rootRouteRef,
    loader: () => import('./components/NetworkPage').then(m => <m.NetworkPage />),
  },
});

export const hubblePlugin = createFrontendPlugin({
  pluginId: 'hubble',
  extensions: [hubbleApi, entityNetworkContent, networkPage],
  routes: { root: rootRouteRef },
});
