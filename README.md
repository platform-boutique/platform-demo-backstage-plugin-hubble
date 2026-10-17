# platform-demo-backstage-plugin-hubble

Backstage plugin that shows Hubble (Cilium) network flows on the entity pages of the platform-demo portal: a **Network** tab per
service and a namespace-wide **Network** page.

| Package | Path |
|---|---|
| `@platform-boutique/backstage-plugin-hubble` (frontend) | `plugins/hubble` |
| `@platform-boutique/backstage-plugin-hubble-backend` | `plugins/hubble-backend` |

The documentation is in `docs/` (rendered in the portal): how it works, installing, developing. Short version:

```bash
yarn install && yarn tsc && yarn build
```

Part of the [platform-boutique](https://github.com/platform-boutique) organisation; consumed by `platform-demo-backstage`.
