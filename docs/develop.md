# Develop

```bash
yarn install
yarn tsc                 # type check both packages
yarn build               # backstage-cli build
yarn backstage-cli repo fix --publish
for p in hubble hubble-backend; do (cd plugins/$p && yarn pack --out ../../dist-pack/$p.tgz); done
```

Copy the tarballs to `platform-demo-backstage/vendor/` under the names the portal's `package.json` references, then `yarn install`
there and rebuild the image.

## Testing against a cluster

With the portal running on a laptop (`yarn start` in `platform-demo-backstage`) and a kubeconfig for the cluster, port-forward Relay and point the config at it:

```bash
kubectl -n kube-system port-forward svc/hubble-relay 4245:80
```

```yaml title="app-config.local.yaml (portal)"
hubble:
  relayAddress: localhost:4245
```

## Upgrading the API definitions

When Cilium is upgraded, replace `plugins/hubble-backend/proto/*` with the files from the same tag
(`api/v1/{observer,flow,relay,peer}` in cilium/cilium) and run the type check; the API is backwards compatible within a major version.
