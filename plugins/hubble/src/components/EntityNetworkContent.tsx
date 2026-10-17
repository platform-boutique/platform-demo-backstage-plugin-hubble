import { useEntity } from '@backstage/plugin-catalog-react';
import { MissingAnnotationEmptyState } from '@backstage/core-components';
import { FlowsTable } from './FlowsTable';

const SELECTOR = 'backstage.io/kubernetes-label-selector';
const NAMESPACE = 'backstage.io/kubernetes-namespace';

/** "app.kubernetes.io/name=frontend" -> "frontend" (the identity label Cilium and Kyverno use) */
function workloadFromSelector(selector?: string): string | undefined {
  return selector
    ?.split(',')
    .map(s => s.trim())
    .find(s => s.startsWith('app.kubernetes.io/name='))
    ?.split('=')[1];
}

export function EntityNetworkContent() {
  const { entity } = useEntity();
  const annotations = entity.metadata.annotations ?? {};
  const workload = workloadFromSelector(annotations[SELECTOR]) ?? annotations['backstage.io/kubernetes-id'];
  if (!workload) return <MissingAnnotationEmptyState annotation={SELECTOR} />;
  return <FlowsTable title={`Network flows of ${workload}`} workload={workload} namespace={annotations[NAMESPACE]} />;
}
