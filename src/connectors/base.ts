import type { RawJobData } from "@/types";

export interface JobConnector {
  readonly id: string;
  readonly name: string;
  readonly type: string;

  fetch(params: FetchParams): AsyncGenerator<RawJobData>;

  checkHealth(): Promise<{ ok: boolean; error?: string }>;

  rateLimit?: { requestsPerMinute: number };
}

export interface FetchParams {
  keywords?: string[];
  location?: string;
  limit?: number;
  since?: Date;
}
