import { Provider, IAgentRuntime, Memory, State, elizaLogger } from "@ai16z/eliza";
import { Scraper, Tweet } from "agent-twitter-client";

interface TwitterKolConfig {
  accounts: string[];
  maxAgeDays: number;
  cacheTimeout: number;
}

class TwitterKolProvider implements Provider {
  private config: TwitterKolConfig;
  private cache: Map<string, Tweet[]>;
  private lastFetch: Map<string, number>;
  private scraper: Scraper | null = null;
  private isInitialized: boolean = false;

  constructor(config: TwitterKolConfig) {
    this.config = {
      accounts: config.accounts,
      maxAgeDays: config.maxAgeDays || 7,
      cacheTimeout: config.cacheTimeout || 15 * 60 * 1000, // 15 min by default
    };
    this.cache = new Map();
    this.lastFetch = new Map();
  }

  private async initializeScraper(runtime: IAgentRuntime): Promise<void> {
    if (!this.isInitialized) {
      this.scraper = new Scraper();

      await this.scraper.login(
        runtime.getSetting("TWITTER_SCRAPER_USERNAME"),
        runtime.getSetting("TWITTER_SCRAPER_PASSWORD")
      );

      if (await this.scraper.isLoggedIn()) {
        this.isInitialized = true;
        elizaLogger.log("Twitter scraper initialized successfully");
      } else {
        throw new Error("Failed to initialize Twitter scraper");
      }
    }
  }

  async get(runtime: IAgentRuntime, message: Memory, state?: State): Promise<string> {
    try {
      await this.initializeScraper(runtime);
      const tweets = await this.getAllRecentTweets();
      return this.formatTweets(tweets);
    } catch (error) {
        elizaLogger.error("TwitterKolProvider error:", error);
      return "Unable to fetch recent tweets at this time.";
    }
  }

  private async getAllRecentTweets(): Promise<Tweet[]> {
    const allTweets: Tweet[] = [];

    for (const account of this.config.accounts) {
      const tweets = await this.getAccountTweets(account);
      allTweets.push(...tweets);
    }

    return allTweets.sort((a, b) => {
      const timeA = a.timeParsed?.getTime() || 0;
      const timeB = b.timeParsed?.getTime() || 0;
      return timeB - timeA;
    });
  }

  private async getAccountTweets(username: string): Promise<Tweet[]> {
    const now = Date.now();
    const lastFetchTime = this.lastFetch.get(username) || 0;

    if (now - lastFetchTime < this.config.cacheTimeout) {
      elizaLogger.log(`Use cached tweets for @${username}`);

      return this.cache.get(username) || [];
    }

    const tweets = await this.fetchTweetsFromAPI(username);
    const cleanedTweets = this.removeOldTweets(tweets);

    this.cache.set(username, cleanedTweets);
    this.lastFetch.set(username, now);

    return cleanedTweets;
  }

  private async fetchTweetsFromAPI(username: string): Promise<Tweet[]> {
    if (!this.scraper) {
      throw new Error("Scraper not initialized");
    }

    try {
      elizaLogger.log(`Fetch tweets for @${username}`);

      const tweets: Tweet[] = [];
      const tweetIterator = this.scraper.getTweets(username, 20);

      for await (const tweet of tweetIterator) {
        if (tweet.isRetweet && tweet.retweetedStatus) {
            // If the tweet is a retweet, use the text of the retweeted status
            tweets.push(tweet.retweetedStatus);
        } else {
            // Otherwise, use the text of the tweet itself
            tweets.push(tweet);
        }
      }

      return tweets;
    } catch (error) {
      elizaLogger.error(`Failed to fetch tweets for ${username}:`, error);
      return [];
    }
  }

  private removeOldTweets(tweets: Tweet[]): Tweet[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.maxAgeDays);
    return tweets.filter(tweet => {
      const tweetDate = tweet.timeParsed || new Date(tweet.timestamp || 0);
      return tweetDate >= cutoffDate;
    });
  }

  private formatTweets(tweets: Tweet[]): string {
    if (tweets.length === 0) {
      return "No recent tweets from tracked accounts.";
    }

    const formattedTweets = tweets
      .slice(0, 10)
      .map(tweet => {
        const date = tweet.timeParsed?.toLocaleDateString() || 'Unknown date';
        const username = tweet.username || 'Unknown user';
        const engagement = [
          tweet.replies && `💬 ${tweet.replies}`,
          tweet.retweets && `🔁 ${tweet.retweets}`,
          tweet.likes && `❤️ ${tweet.likes}`,
          tweet.views && `👁️ ${tweet.views}`
        ].filter(Boolean).join(' | ');

        let tweetContent = `🐦 @${username} (${date}):\n${tweet.text || ''}`;

        // Add media information
        // if (tweet.photos?.length > 0) {
        //   tweetContent += `\n📷 ${tweet.photos.length} photo(s)`;
        // }
        // if (tweet.videos?.length > 0) {
        //   tweetContent += `\n🎥 ${tweet.videos.length} video(s)`;
        // }
        if (tweet.urls?.length > 0) {
          tweetContent += `\n🔗 ${tweet.urls.join(' ')}`;
        }

        // Add engagement metrics
        tweetContent += `\n${engagement}`;

        return tweetContent;
      })
      .join('\n\n');

    return `Recent tweets from Kols:\n\n${formattedTweets}`;
  }

  public async destroy(): Promise<void> {
    if (this.scraper && this.isInitialized) {
      await this.scraper.logout();
      this.isInitialized = false;
      this.scraper = null;
    }
    this.clearCache();
  }

  public clearCache(): void {
    this.cache.clear();
    this.lastFetch.clear();
  }
}

export { TwitterKolProvider };