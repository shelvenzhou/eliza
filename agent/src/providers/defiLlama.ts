import { Provider, IAgentRuntime, Memory, State } from "@ai16z/eliza";

interface DefiPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number | null;
  apy: number;
  rewardTokens: string[] | null;
  pool: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictions: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  } | null;
  poolMeta: string | null;
  mu: number | null;
  sigma: number | null;
  count: number | null;
  outlier: boolean;
  underlyingTokens: string[] | null;
  il7d: number | null;
  apyBase7d: number | null;
  apyMean30d: number | null;
  volumeUsd1d: number | null;
  volumeUsd7d: number | null;
  apyBaseInception: number | null;
}

interface DefiLlamaResponse {
  status: string;
  data: DefiPool[];
}

class DefiLlamaCache {
  private static instance: DefiLlamaCache;
  private cache: DefiPool[] = [];
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
  private readonly API_URL = 'https://yields.llama.fi/pools';

  private constructor() {}

  public static getInstance(): DefiLlamaCache {
    if (!DefiLlamaCache.instance) {
      DefiLlamaCache.instance = new DefiLlamaCache();
    }
    return DefiLlamaCache.instance;
  }

  private async fetchData(): Promise<DefiPool[]> {
    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json() as DefiLlamaResponse;
      if (data.status === 'success') {
        return data.data;
      }
      throw new Error('Failed to fetch data from DefiLlama');
    } catch (error) {
      console.error('Error fetching DefiLlama ', error);
      return [];
    }
  }

  public async getData(): Promise<DefiPool[]> {
    const now = Date.now();
    if (this.cache.length === 0 || now - this.lastUpdate > this.CACHE_DURATION) {
      const freshData = await this.fetchData();
      if (freshData.length > 0) {
        this.cache = freshData;
        this.lastUpdate = now;
      }
    }
    return this.cache;
  }

  public getLastUpdateTime(): number {
    return this.lastUpdate;
  }
}

const formatPoolData = (pools: DefiPool[]): string => {
  return pools
    .slice(0, 5) // Only show top 5 pools
    .map(pool => {
      return `
Project: ${pool.project} (${pool.chain})
Symbol: ${pool.symbol}
TVL: $${(pool.tvlUsd / 1e6).toFixed(2)}M
APY: ${pool.apy.toFixed(2)}%
${pool.apyReward ? `Reward APY: ${pool.apyReward.toFixed(2)}%` : ''}
-------------------`;
    })
    .join('\n');
};

const defiLlamaProvider: Provider = {
  get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
    const cache = DefiLlamaCache.getInstance();
    const pools = await cache.getData();
    const lastUpdate = new Date(cache.getLastUpdateTime());

    if (pools.length === 0) {
      return "Sorry, I couldn't fetch DeFi yield data at the moment.";
    }

    return `
DeFi Yield Data from DefiLlama (Last updated: ${lastUpdate.toLocaleString()})
Top pools by TVL:
${formatPoolData(pools)}

Note: Data is cached and refreshed every 15 minutes.`;
  },
};

export { defiLlamaProvider, DefiLlamaCache };