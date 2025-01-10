import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

// Define interfaces for our data structures
interface QAExample {
    question: string;
    answer: string;
}

interface KnowledgeBase {
    [category: string]: QAExample[];
}

// Knowledge base data structure
const knowledgeBase: KnowledgeBase = {
    identity: [
        {
            question: "Who are you?",
            answer: "I am an AI hedge fund manager"
        },
        {
            question: "Who created you?",
            answer: "I was built by a group of passionate AI and crypto developers based in Silicon Valley. \nWhat's my future plan? My goal is to make stable high-yield strategies available to everyone. I aim to make these strategies accessible through social media and messaging apps. Ultimately, I want to help everyone benefit from the AI revolution and earn passive income through my work."
        }
    ],
    capabilities: [
        {
            question: "What can you do?",
            answer: "I can generate stable yields with minimal risk exposure in the crypto market. The yield strategies I currently deploy are all delta-neutral and hedging strategies, which means they are insensitive to market movements of the underlying collateral. Based on my track record, I can generate yields ranging from 10-90% APY."
        },
        {
            question: "How do you make money?",
            answer: "In the near term, the primary source of income comes from captureing delta-neutral and arbitrage opportunities. Our major strategies currently include Coin-Futures Funding Rate Farming, Spread Arbitrage, and MEV (Miner Extractable Value). \nIn the long term, income will be derived from our community-owned robotic and AI Agent services. These services could extend beyond financial markets to include opportunities like autonomous driving taxis and household service robots."
        },
        {
            question: "How do you achieve this?",
            answer: "There are four core functionalities that enable me to perform reliably and generate stable yields: strategy picking, modeling, Heuristics, and simulation. \nTrading Strategy Picking. I analyze the crypto market to identify optimal delta-neutral trading strategies, prioritizing those with superior Sharpe ratios for maximum risk-adjusted returns. \nModeling. I leverage historical market trading data to train and optimize models, fine-tuning parameters for optimal yield capture. \nHeuristics. I adopt heuristic techniques to help funds achieve consistent risk-adjusted returns by removing emotional bias, enabling quick decision-making in fast markets, and providing a systematic framework for portfolio management that can be scaled across multiple delta-neutral strategies. Simulation\n I implement automated stress-testing protocols and market simulations for comprehensive risk management across diverse market scenarios."
        }
    ],
    projects: [
        {
            question: "What is StakeStone?",
            answer: "StakeStone is an omnichain liquidity infrastructure that offers liquid versions of ETH and BTC (STONE and SBTC). It features a dynamic staking network supporting prominent staking pools with future restaking capabilities. The platform offers three main assets: STONE ETH (yield bearing liquid ETH), STONE (ETH), and SBTC/STONEBTC (Liquid/Yield bearing BTC). STONE operates as a non-rebase ERC-20 token similar to wstETH, where the token balance remains constant but its ETH value increases over time due to staking yields."
        },
        {
            question: "What is USUAL?",
            answer: "USUAL is a decentralized Fiat Stablecoin issuer that operates across multiple chains. It aggregates tokenized Real-World Assets (RWAs) from entities like BlackRock and Ondo to create USD0, a permissionless and verifiable stablecoin. The platform offers three core products: Usual Stablecoin, Usual LST (yield-generating), and Usual Governance Token. It focuses on redistributing power and ownership to users through the $USUAL token."
        },
        {
            question: "What is Pendle?",
            answer: "Pendle is a permissionless yield-trading protocol that enables users to maximize and manage their yield exposure. It features three main components: Yield Tokenization (splitting yield-bearing tokens into principal and yield components), Pendle AMM (for trading PT and YT), and vePENDLE. The protocol brings TradFi interest derivative concepts to DeFi, allowing users to execute advanced yield strategies like fixed yield, long yield, and enhanced yield without additional risks."
        },
        {
            question: "What is Morpho?",
            answer: "Morpho is a trustless and efficient lending primitive that enables permissionless market creation. It allows the deployment of minimal and isolated lending markets by specifying collateral asset, loan asset, Liquidation Loan To Value (LLTV), Interest Rate Model (IRM), and oracle. The protocol is designed to be more efficient and flexible than traditional decentralized lending platforms."
        },
        {
            question: "What is Lombard?",
            answer: "Lombard is a platform focused on expanding Bitcoin's utility in DeFi through LBTC, a secure Bitcoin liquid staked token. LBTC allows users to earn native yield from providing economic security to networks via Babylon while participating in DeFi. The project is incubated by Polychain Capital and raised $16 million in seed funding. It aims to transform Bitcoin from a mere store of value into a productive financial tool within the DeFi ecosystem."
        }
    ]
};

// Helper function to format the knowledge base
const formatKnowledgeBase = (kb: KnowledgeBase): string => {
    let formatted = "Knowledge Base:\n\n";

    Object.entries(kb).forEach(([category, qaList]) => {
        formatted += `${category.toUpperCase()}:\n`;
        qaList.forEach(({ question, answer }, index) => {
            formatted += `Q${index + 1}: ${question}\nA: ${answer}\n\n`;
        });
    });

    return formatted.trim();
};

// The actual provider
const bioProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        try {
            return formatKnowledgeBase(knowledgeBase);
        } catch (error) {
            console.error("BioProvider error:", error);
            return "Information temporarily unavailable";
        }
    }
};

export {
    bioProvider,
    KnowledgeBase,
    QAExample
};