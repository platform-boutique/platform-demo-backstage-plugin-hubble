# Install and configure

## Packages

| Package | Role |
|---|---|
| `@platform-boutique/backstage-plugin-hubble` | Frontend plugin (new frontend system) |
| `@platform-boutique/backstage-plugin-hubble-backend` | Backend plugin |

```bash
yarn --cwd packages/app add @platform-boutique/backstage-plugin-hubble
yarn --cwd packages/backend add @platform-boutique/backstage-plugin-hubble-backend
```

```ts title="packages/backend/src/index.ts"
backend.add(import('@platform-boutique/backstage-plugin-hubble-backend'));
```

The frontend package has a default export, so with `app.packages: all` nothing else is needed.

!!! note "Until there is a package registry"
    The portal installs the packages from tarballs in its `vendor/` folder (`yarn pack` in this repository, copy, `yarn install`).
    Publishing to npm or GitHub Packages replaces that with a version number.

## Configuration

```yaml title="app-config.yaml"
hubble:
  relayAddress: hubble-relay.kube-system.svc.cluster.local:80   # plaintext gRPC
  maxFlows: 200                                                  # per request
```

## What the cluster must allow

- Hubble Relay enabled in Cilium (`hubble.relay.enabled: true`); its client-facing endpoint is plaintext unless you turn on `hubble.relay.tls.server`.
- The portal's pod can reach `hubble-relay` in `kube-system`. The platform has default-deny network policies; the Backstage chart's CiliumNetworkPolicy (`networkPolicy.enabled`) carries the egress rule for it.
- Entities carry `backstage.io/kubernetes-label-selector: app.kubernetes.io/name=<workload>` and `backstage.io/kubernetes-namespace`.
