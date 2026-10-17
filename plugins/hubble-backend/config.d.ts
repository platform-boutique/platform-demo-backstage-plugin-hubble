export interface Config {
  /** Hubble plugin configuration */
  hubble?: {
    /**
     * Address of Hubble Relay's gRPC endpoint (host:port, plaintext).
     * In the cluster: the `hubble-relay` Service in kube-system.
     */
    relayAddress?: string;
    /**
     * Upper bound of flows returned by one request.
     * @default 200
     */
    maxFlows?: number;
  };
}
