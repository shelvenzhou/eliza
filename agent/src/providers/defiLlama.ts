import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";

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

interface Protocol {
    name: string;
    symbol: string;
    category: string;
    tvl: number;
    chainTvls: Record<string, number>;
    chains: string[];
    description?: string;
    url?: string;
    twitter?: string;
    change_1h?: number | null;
    change_1d?: number | null;
    change_7d?: number | null;
    hallmarks?: [number, string][];
    mcap?: number | null;
}

interface DefiLlamaResponse {
    status: string;
    data: DefiPool[];
}

class DefiLlamaCache {
    private static instance: DefiLlamaCache;
    private poolsCache: DefiPool[] = [];
    private protocolsCache: Protocol[] = [];
    private lastPoolUpdate: number = 0;
    private lastProtocolUpdate: number = 0;
    private readonly CACHE_DURATION = 15 * 60 * 1000;

    private readonly ENDPOINTS = {
        pools: "https://yields.llama.fi/pools",
        protocols: "https://api.llama.fi/protocols",
    };

    private constructor() {}

    public static getInstance(): DefiLlamaCache {
        if (!DefiLlamaCache.instance) {
            DefiLlamaCache.instance = new DefiLlamaCache();
        }
        return DefiLlamaCache.instance;
    }

    private async fetchData<T>(endpoint: string): Promise<T> {
        try {
            elizaLogger.log(`Fetch data from ${endpoint}`);
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return (await response.json()) as T;
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            throw error;
        }
    }

    public async getPools(): Promise<DefiPool[]> {
        const now = Date.now();
        if (
            this.poolsCache.length === 0 ||
            now - this.lastPoolUpdate > this.CACHE_DURATION
        ) {
            const response = await this.fetchData<DefiLlamaResponse>(
                this.ENDPOINTS.pools
            );
            if (response.status === "success") {
                this.poolsCache = response.data;
                this.lastPoolUpdate = now;
            }
        }
        return this.poolsCache;
    }

    public async getProtocols(): Promise<Protocol[]> {
        const now = Date.now();
        if (
            this.protocolsCache.length === 0 ||
            now - this.lastProtocolUpdate > this.CACHE_DURATION
        ) {
            this.protocolsCache = await this.fetchData<Protocol[]>(
                this.ENDPOINTS.protocols
            );
            this.lastProtocolUpdate = now;
        }
        return this.protocolsCache;
    }

    public getLastUpdateTimes() {
        return {
            pools: this.lastPoolUpdate,
            protocols: this.lastProtocolUpdate,
        };
    }
}

const formatPoolData = (pools: DefiPool[]): string => {
    const formatNumber = (num: number | null, decimals: number = 2): string => {
        if (num === null) return "N/A";
        const value = num.toFixed(decimals);
        return num >= 0 ? `+${value}` : value;
    };

    const formatUSD = (num: number | null): string => {
        if (num === null) return "N/A";
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        return `$${num.toFixed(2)}`;
    };

    const formatPrediction = (predictions: any): string => {
        if (!predictions) return "N/A";
        return `${predictions.predictedClass} (${predictions.predictedProbability}%)`;
    };

    const header = `
DeFi Pool Analytics
• TVL: Total Value Locked
• APY: Annual Percentage Yield (Base: Protocol, Reward: Additional incentives)
• Changes: APY changes over time periods (24h/7d/30d)
• Volume: Trading volume in USD
• Exposure: Single/Multiple token(s) in pool
• IL Risk: Impermanent Loss Risk
• μ (Mean) & σ (Std Dev): Statistical measures of APY stability
• Prediction: Expected APY trend with confidence level
═══════════════════════════════════════\n`;

    const poolsData = pools
        .slice(0, 100)
        .map((pool) => {
            return [
                `${pool.project} | ${pool.chain} | ${pool.symbol}`,
                `TVL: ${formatUSD(pool.tvlUsd)} | ${pool.exposure} exposure | IL: ${pool.ilRisk === "no" ? "No" : "Yes"}`,
                `APY: ${formatNumber(pool.apy)}% (Base: ${formatNumber(pool.apyBase)}% + Reward: ${pool.apyReward ? formatNumber(pool.apyReward) : "0"}%)`,
                `Changes: ${formatNumber(pool.apyPct1D)}%(24h) ${formatNumber(pool.apyPct7D)}%(7d) ${formatNumber(pool.apyPct30D)}%(30d)`,
                `Vol: ${formatUSD(pool.volumeUsd1d)}(24h) ${formatUSD(pool.volumeUsd7d)}(7d)`,
                `μ: ${formatNumber(pool.mu)} σ: ${formatNumber(pool.sigma)} | ${pool.stablecoin ? "Stable" : "Not Stable"}`,
                `Prediction: ${formatPrediction(pool.predictions)}`,
                "-------------------",
            ].join("\n");
        })
        .join("\n");

    return header + poolsData;
};

const formatProtocolData = (protocols: Protocol[]): string => {
    const MAX_PROTOCOLS = 50;
    const MAX_TOP_CHAINS = 5;
    const BILLION = 1e9;
    const MILLION = 1e6;
    const DESC_CHAR_LIMIT = 100;

    const legend = `
LEGEND
[NAME] Protocol name and symbol
[TVL] Total Value Locked
[MCap] Market Capitalization
[CHANGES] Price changes: 1H | 24H | 7D
[CHAINS] Top ${MAX_TOP_CHAINS} chains by TVL (total chain count)
──────────────────────────────────────
`;

    const formatMoney = (amount: number): string => {
        if (!amount) return "$0";
        if (amount >= BILLION) return `$${(amount / BILLION).toFixed(2)}B`;
        if (amount >= MILLION) return `$${(amount / MILLION).toFixed(2)}M`;
        return `$${Math.round(amount).toLocaleString()}`;
    };

    const formatChange = (change: number | null | undefined): string => {
        if (!change) return "-";
        const sign = change > 0 ? "↑" : "↓";
        return `${sign}${Math.abs(change).toFixed(1)}%`;
    };

    const truncateStr = (str: string, limit: number): string =>
        str.length > limit ? str.slice(0, limit) + "..." : str;

    try {
        const formattedProtocols = protocols
            .slice(0, MAX_PROTOCOLS)
            .map((p) => {
                const topChains = Object.entries(p.chainTvls)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, MAX_TOP_CHAINS)
                    .filter(([, tvl]) => tvl > 0)
                    .map(([chain, tvl]) => `${chain}: ${formatMoney(tvl)}`)
                    .join(" | ");

                return `NAME: ${p.name}${p.symbol !== "-" ? ` (${p.symbol})` : ""}
TVL: ${formatMoney(p.tvl)}${p.mcap ? ` | MCap: ${formatMoney(p.mcap)}` : ""}
CHANGES: ${formatChange(p.change_1h)} | ${formatChange(p.change_1d)} | ${formatChange(p.change_7d)}
CATEGORY: ${p.category}
CHAINS: ${topChains} (${p.chains.length} total)
${p.description ? `DESC: ${truncateStr(p.description, DESC_CHAR_LIMIT)}` : ""}
${p.url ? `URL: ${p.url}` : ""}
${p.twitter ? `TWITTER: @${p.twitter}` : ""}
──────────────────────────────────────`;
            })
            .join("\n\n");

        return legend + formattedProtocols;
    } catch (error) {
        console.error("Error formatting protocol ", error);
        return "Error formatting protocol data";
    }
};

const defiLlamaProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        const cache = DefiLlamaCache.getInstance();
        try {
            const [pools, protocols] = await Promise.all([
                cache.getPools(),
                cache.getProtocols(),
            ]);

            // Sort protocols by TVL
            const sortedProtocols = protocols.sort((a, b) => b.tvl - a.tvl);
            const sortedPools = pools.sort((a, b) => b.tvlUsd - a.tvlUsd);

            const updateTimes = cache.getLastUpdateTimes();

            return `
DeFi Data Summary (Last updated: ${new Date(Math.max(...Object.values(updateTimes))).toLocaleString()})

=== TOP PROTOCOLS BY TVL ===
${formatProtocolData(sortedProtocols)}

=== YIELD POOLS ===
${formatPoolData(sortedPools)}

Note: Data is cached and refreshed every 15 minutes.`;
        } catch (error) {
            console.error("Error in defiLlamaProvider:", error);
            return "Cannot fetch DeFiLlama data at the moment. Please try again later.";
        }
    },
};

export { defiLlamaProvider, DefiLlamaCache };
