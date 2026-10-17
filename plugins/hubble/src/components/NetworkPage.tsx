import { Content, Header, Page } from '@backstage/core-components';
import { FlowsTable } from './FlowsTable';

/** Cluster-wide view: recent flows of the shop's namespace, the place to look when something is dropped. */
export function NetworkPage() {
  return (
    <Page themeId="tool">
      <Header title="Network" subtitle="Cilium and Hubble: who talked to whom, what was dropped and why" />
      <Content>
        <FlowsTable title="Flows in platform-demo" namespace="platform-demo" />
      </Content>
    </Page>
  );
}
