import type { RuleOutcome } from "../types/result";

export interface IpIntelResult {
  country?: string;
  isVpn?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
  isHosting?: boolean;
}

export interface EmailIntelResult {
  disposable?: boolean;
  role?: boolean;
  valid?: boolean;
}
