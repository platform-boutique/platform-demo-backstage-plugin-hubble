# Hubble / Cilium plugin

<div class="pd-hero" markdown>
<span class="pd-kicker">backstage plugin · network</span>

Cilium decides which workloads may talk to each other, and Hubble records every decision. This plugin puts that record on the
page of the service it is about: who called it, who it called, what was **dropped and why**, and which connections were
mutually authenticated. It replaces the Hubble UI for day-to-day use.
</div>

<div class="pd-facts" markdown>
<div><span>Adds</span><strong>Network tab</strong><small>on every entity that runs in the cluster</small></div>
<div><span>Adds</span><strong>Network page</strong><small>flows of the whole namespace</small></div>
<div><span>Reads</span><strong>Hubble Relay</strong><small>gRPC, last 150 flows, 10 s refresh</small></div>
<div><span>Packages</span><strong>2</strong><small>frontend + backend plugin</small></div>
</div>

## What you see

| Element | Meaning |
|---|---|
| Counters | Flows by verdict in the current window: forwarded, dropped, error, audit |
| Verdict chip | Green forwarded, red dropped or error, amber audit and the rest |
| From / To | `namespace/workload` (the `app.kubernetes.io/name` label, which is also Cilium's and Kyverno's notion of identity), or the DNS name for traffic that leaves the cluster |
| Detail | The drop reason (`POLICY_DENIED`, `AUTH_REQUIRED` ...), or the HTTP / DNS summary where Hubble parsed one |
| Auth | The authentication type of the connection (`SPIRE` for mutual authentication) |

!!! tip "Reading the first seconds after a rollout"
    A new workload needs 10-15 seconds before mutual authentication works. Short bursts of `DROPPED` with *Authentication
    required* right after a rollout are expected and disappear on their own.

## What it deliberately does not do

It does not stream or draw the service map, and it keeps no history: it shows what Hubble Relay holds in its ring buffer. For the live
service map and a flow tail, `hubble observe` in the Cilium agent still works. Longer retention is the
Hubble-metrics-to-Grafana work item.
