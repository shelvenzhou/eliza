import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@ai16z/eliza";

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
    private readonly API_URL = "https://yields.llama.fi/pools";

    private constructor() {}

    public static getInstance(): DefiLlamaCache {
        if (!DefiLlamaCache.instance) {
            DefiLlamaCache.instance = new DefiLlamaCache();
        }
        return DefiLlamaCache.instance;
    }

    private async fetchData(): Promise<DefiPool[]> {
        try {
            elizaLogger.log(`Fetch data from ${this.API_URL}`);

            const response = await fetch(this.API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = (await response.json()) as DefiLlamaResponse;
            if (data.status === "success") {
                return data.data;
            }
            throw new Error("Failed to fetch data from DefiLlama");
        } catch (error) {
            console.error("Error fetching DefiLlama ", error);
            return [];
        }
    }

    public async getData(): Promise<DefiPool[]> {
        const now = Date.now();
        if (
            this.cache.length === 0 ||
            now - this.lastUpdate > this.CACHE_DURATION
        ) {
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
        .slice(0, 80)
        .map((pool) => {
            const formatNumber = (
                num: number | null,
                decimals: number = 2
            ): string => {
                return num !== null ? num.toFixed(decimals) : "N/A";
            };

            const formatUSD = (num: number | null): string => {
                if (num === null) return "N/A";
                return `$${(num / 1e6).toFixed(2)}M`;
            };

            return `
Project: ${pool.project} (${pool.chain})
Symbol: ${pool.symbol}
Pool: ${pool.pool}
TVL: ${formatUSD(pool.tvlUsd)}
Base APY: ${formatNumber(pool.apyBase)}%
Reward APY: ${pool.apyReward ? `${formatNumber(pool.apyReward)}%` : "N/A"}
Total APY: ${formatNumber(pool.apy)}%
24h Change: ${formatNumber(pool.apyPct1D)}%
7d Change: ${formatNumber(pool.apyPct7D)}%
30d Change: ${formatNumber(pool.apyPct30D)}%
Volume 24h: ${formatUSD(pool.volumeUsd1d)}
Volume 7d: ${formatUSD(pool.volumeUsd7d)}
Stablecoin: ${pool.stablecoin ? "Yes" : "No"}
Reward Tokens: ${pool.rewardTokens ? pool.rewardTokens.join(", ") : "N/A"}
Underlying Tokens: ${pool.underlyingTokens ? pool.underlyingTokens.join(", ") : "N/A"}
-------------------`;
        })
        .join("\n");
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
