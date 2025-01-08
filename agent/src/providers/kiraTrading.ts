import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";

interface TradingData {
    portfolioLatest: any[];
    trackRecords: any[];
    aprAttributes: any[];
    timestamp: number;
}

class KiraTradingProvider implements Provider {
    private cache: TradingData | null = null;
    private lastFetch: number = 0;
    private token: string | null = null;
    private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

    private async login(username: string, password: string): Promise<string> {
        const response = await fetch(
            "https://max1-funding-arb.uc.r.appspot.com/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            }
        );

        if (!response.ok) {
            throw new Error("Login failed");
        }

        elizaLogger.info("Login successful");
        const data = await response.json();
        return data.access_token;
    }

    private async fetchWithAuth(endpoint: string): Promise<any> {
        if (!this.token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(
            `https://max1-funding-arb.uc.r.appspot.com/${endpoint}`,
            {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch ${endpoint}`);
        }

        return response.json();
    }

    private async refreshData(): Promise<TradingData> {
        const [portfolioLatest, trackRecords, aprAttributes] =
            await Promise.all([
                this.fetchWithAuth("portfolio_latest"),
                this.fetchWithAuth("track_records_daily_latest"),
                this.fetchWithAuth("monitor_apr_attribute"),
            ]);

        return {
            portfolioLatest,
            trackRecords,
            aprAttributes,
            timestamp: Date.now(),
        };
    }

    private formatTradingData(data: TradingData): string {
        const { portfolioLatest, trackRecords, aprAttributes, timestamp } =
            data;
        const currentTime = new Date();
        const dataTime = new Date(timestamp);
        const timeDiff = Math.floor((currentTime.getTime() - timestamp) / 1000); // difference in seconds

        // Calculate portfolio summary
        const totalAssetsValue = portfolioLatest.reduce(
            (sum, asset) => sum + parseFloat(asset.assets_value),
            0
        );

        const lastTrackRecord = trackRecords[0] || {};
        const topAprOpportunities = aprAttributes
            .sort((a, b) => b.apr_score - a.apr_score)
            .slice(0, 5);

        return `
=== Kira Trading Data ===
Last Updated: ${dataTime.toLocaleString()} (${timeDiff} seconds ago)

Current Portfolio Status:
- Total Assets Value: $${totalAssetsValue.toFixed(2)}
- Portfolio APR: ${(parseFloat(lastTrackRecord.portfolio_implied_apr || "0") * 100).toFixed(2)}%
- Net Exposure: ${lastTrackRecord.net_exposure_value || "0"}

Top Trading Opportunities:
${topAprOpportunities
    .map(
        (opp) =>
            `- ${opp.symbol}: APR ${(parseFloat(opp.apr_score) * 100).toFixed(2)}%`
    )
    .join("\n")}

Portfolio Composition:
${portfolioLatest
    .map(
        (asset) =>
            `- ${asset.symbol}: $${parseFloat(asset.assets_value).toFixed(2)} (${(parseFloat(asset.portfolio_allocation) * 100).toFixed(2)}%)`
    )
    .join("\n")}
        `.trim();
    }

    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string> {
        try {
            // Check if we need to refresh the cache
            const now = Date.now();
            if (!this.cache || now - this.lastFetch > this.CACHE_DURATION) {
                // Get credentials from runtime settings
                const username = runtime.getSetting("KIRA_TRADING_USERNAME");
                const password = runtime.getSetting("KIRA_TRADING_PASSWORD");

                // Login if needed
                if (!this.token) {
                    this.token = await this.login(username, password);
                }

                // Fetch fresh data
                this.cache = await this.refreshData();
                this.lastFetch = now;
            }

            return this.formatTradingData(this.cache);
        } catch (error) {
            elizaLogger.error("KiraTradingProvider error:", error);
            return "Unable to fetch Kira Trading data at the moment. Please try again later.";
        }
    }
}

export const kiraTradingProvider = new KiraTradingProvider();
