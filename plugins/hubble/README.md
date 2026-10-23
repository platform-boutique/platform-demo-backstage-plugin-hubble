# hubble

Frontend plugin of `@platform-boutique/backstage-plugin-hubble` (Hubble / Cilium): the **Network** tab and page: Hubble flows, drops and why, mutual authentication. It is written for Backstage's new frontend
system and has a default export, so an app with `app.packages: all` picks it up.

This repository has no Backstage app of its own. The plugin is packed (`yarn pack`) and consumed by `platform-demo-backstage`; see the
repository README and `docs/` (install and configuration) for how.
