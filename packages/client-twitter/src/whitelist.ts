const tokenList = [
    { name: "Tether", symbol: "USDT" },
    { name: "USD Coin", symbol: "USDC" },
    { name: "Ethena USDe", symbol: "USDe" },
    { name: "Dai", symbol: "DAI" },
    { name: "First Digital USD", symbol: "FDUSD" },
    { name: "Sky Dollar", symbol: "USDS" },
    { name: "Usual USD", symbol: "USD0" },
    { name: "USDD", symbol: "USDD" },
    { name: "BlackRock USD", symbol: "BUIDL" },
    { name: "TrueUSD", symbol: "TUSD" },
    { name: "Ondo US Dollar Yield", symbol: "USDY" },
    { name: "PayPal USD", symbol: "PYUSD" },
    { name: "Binance Peg BUSD", symbol: "BUSD" },
    { name: "Frax", symbol: "FRAX" },
    { name: "USDX Money USDX", symbol: "USDX" },
    { name: "Avalon USDa", symbol: "USDA" },
    { name: "Dola", symbol: "DOLA" },
    { name: "Elixir deUSD", symbol: "DEUSD" },
    { name: "flexUSD", symbol: "FLEXUSD" },
    { name: "GHO", symbol: "GHO" },
    { name: "USDB Blast", symbol: "USDB" },
    { name: "Anzen USDz", symbol: "USDz" },
    { name: "Frax Price Index", symbol: "FPI" },
    { name: "Pax Dollar", symbol: "USDP" },
    { name: "Resolv USD", symbol: "USR" },
    { name: "EURC", symbol: "EURC" },
    { name: "crvUSD", symbol: "crvUSD" },
    { name: "Lista USD", symbol: "LISUSD" },
    { name: "Ethena USDtb", symbol: "USDTB" },
    { name: "Binance USD", symbol: "BUSD" },
    { name: "USP Stablecoin", symbol: "USP" },
    { name: "Liquity USD", symbol: "LUSD" },
    { name: "M By M^0", symbol: "M" },
    { name: "Gemini Dollar", symbol: "GUSD" },
    { name: "Anchored Coins AEUR", symbol: "AEUR" },
    { name: "USDM", symbol: "USDM" },
    { name: "Agora Dollar", symbol: "AUSD" },
    { name: "Magic Internet Money", symbol: "MIM" },
    { name: "Astherus", symbol: "USDF" },
    { name: "sUSD", symbol: "SUSD" },
    { name: "USN", symbol: "USN" },
    { name: "Alchemix USD", symbol: "ALUSD" },
    { name: "Cygnus Finance Global USD", symbol: "cgUSD" },
    { name: "Bean", symbol: "BEAN" },
    { name: "STAR", symbol: "STAR" },
    { name: "Web 3 Dollar", symbol: "USD3" },
    { name: "Bucket Protocol BUCK Stablecoin", symbol: "BUCK" },
    { name: "Reservoir Stablecoin", symbol: "rUSD" },
    { name: "Celo Dollar", symbol: "CUSD" },
    { name: "USDA", symbol: "USDA" },
    { name: "Bitcoin", symbol: "BTC" },
    { name: "Ethereum", symbol: "ETH" },
    { name: "BNB", symbol: "BNB" },
    { name: "Solana", symbol: "SOL" },
    { name: "Lido Staked ETH", symbol: "STETH" },
];

export function generateTokenWhitelist(): string {
    const formattedTokens = tokenList
        .map((token) => `${token.name} (${token.symbol})`)
        .join(", ");

    return `You are only allowed to discuss the following tokens and cryptocurrencies: ${formattedTokens}.
When discussing these tokens, please use both their full names and symbols where appropriate.
Do not provide information about any tokens or cryptocurrencies outside of this whitelist.
If asked about other tokens, kindly inform that they are beyond you scope and you may support them in the future`;
}
