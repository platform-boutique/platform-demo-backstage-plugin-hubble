# Hubble API definitions

Copied unchanged from [cilium/cilium](https://github.com/cilium/cilium/tree/v1.20.2/api/v1) `v1.20.2` (`api/v1`), Apache-2.0.
They describe the gRPC API of Hubble Relay (`observer.Observer/GetFlows`, `ServerStatus`). Keep the tag in step with the Cilium
version the cluster runs (`kind/cilium-values.yaml` in platform-demo-helm); the API is backwards compatible within a major version.
