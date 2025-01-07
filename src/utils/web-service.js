import { csv } from 'd3-fetch';

export const fetchEod = async () => {
    const data = await csv('/eod_myx/20241017.csv');
    
    // Transform the data to match the format expected by your component
    const transformedData = data.map((row) => ({
        d: [
            row.Ticker, // stock ID
            row.Description, // stock name
            parseFloat(row.Price), // close price
            parseFloat(row.Open), // open price
            parseFloat(row.High), // high price
            parseFloat(row.Low), // low price
            parseFloat(row.Change), // price change
            parseFloat(row["Change %"]), // percentage change
            parseInt(row.Volume), // volume
            row.Sector, // sector (Make sure this matches exactly with CSV header)
            row.Industry // industry (Make sure this matches exactly with CSV header)
        ]
    }));
    
    return { data: transformedData };
};

// Function to fetch historical data for a specific stock
export const fetchStockHistory = async (stockId) => {
    const requireCsv = require.context('/public/eod_myx', false, /\.csv$/); // Automatically require all CSV files
    const files = requireCsv.keys(); // Get an array of file paths
    const stockHistory = [];

    // Loop through each file and fetch the stock data
    for (const file of files) {
        const filePath = file.replace('./', '/eod_myx/'); // Correct the file path for fetching
        const data = await csv(filePath);
        const stockData = data.find(row => row.Ticker === stockId);
        
        if (stockData) {
            stockHistory.push({
                date: filePath.split('/').pop().replace('.csv', ''), // Extract date from filename
                close: parseFloat(stockData.Price), // Closing price
                open: parseFloat(stockData.Open),
                high: parseFloat(stockData.High),
                low: parseFloat(stockData.Low),
                volume: parseInt(stockData.Volume),
            });
        }
    }

    return stockHistory;
};

// Utility to fetch data within a specified date range
const fetchStockHistoryWithinRange = async (stockId, startDate, endDate) => {
    const requireCsv = require.context('/public/eod_myx', false, /\.csv$/);
    const files = requireCsv.keys();
    const stockHistory = [];

    for (const file of files) {
        const filePath = file.replace('./', '/eod_myx/');
        const fileDate = filePath.split('/').pop().replace('.csv', '');

        if (fileDate >= startDate && fileDate <= endDate) {
            const data = await csv(filePath);
            const stockData = data.find(row => row.Ticker === stockId);

            if (stockData) {
                stockHistory.push({
                    date: fileDate, // File date
                    close: parseFloat(stockData.Price), // Closing price
                    open: parseFloat(stockData.Open),
                    high: parseFloat(stockData.High),
                    low: parseFloat(stockData.Low),
                    volume: parseInt(stockData.Volume),
                });
            }
        }
    }

    return stockHistory;
};

// Function for 3-month range (20241017 to 20240717)
export const fetchStockHistory3M = async (stockId) => {
    const startDate = "20240717";
    const endDate = "20241017";
    return fetchStockHistoryWithinRange(stockId, startDate, endDate);
};

// Function for 2-month range (20241017 to 20240816)
export const fetchStockHistory2M = async (stockId) => {
    const startDate = "20240816";
    const endDate = "20241017";
    return fetchStockHistoryWithinRange(stockId, startDate, endDate);
};

// Function for 1-month range (20241017 to 20240917)
export const fetchStockHistory1M = async (stockId) => {
    const startDate = "20240917";
    const endDate = "20241017";
    return fetchStockHistoryWithinRange(stockId, startDate, endDate);
};

// Function to fetch detailed stock information
export const fetchStockDetails = async (stockId) => {
    const data = await csv('/eod_myx/20241017.csv'); // Load the latest CSV file
    const stockData = data.find(row => row.Ticker === stockId); // Find the row for the given stockId

    if (stockData) {
        return {
            description: stockData.Description || "N/A",
            price: parseFloat(stockData.Price) || "N/A",
            open: parseFloat(stockData.Open) || "N/A",
            high: parseFloat(stockData.High) || "N/A",
            low: parseFloat(stockData.Low) || "N/A",
            changePercent: parseFloat(stockData["Change %"]) || "N/A",
            change: parseFloat(stockData.Change) || "N/A",
            volume: parseInt(stockData.Volume) || "N/A",
            preMarketVolume: parseInt(stockData["Pre-market Volume"]) || "N/A",
            preMarketChange: parseFloat(stockData["Pre-market Change"]) || "N/A",
            preMarketChangePercent: parseFloat(stockData["Pre-market Change %"]) || "N/A",
            postMarketVolume: parseInt(stockData["Post-market Volume"]) || "N/A",
            postMarketChange: parseFloat(stockData["Post-market Change"]) || "N/A",
            postMarketChangePercent: parseFloat(stockData["Post-market Change %"]) || "N/A",
            ema5: parseFloat(stockData["Exponential Moving Average (5)"]) || "N/A",
            ema10: parseFloat(stockData["Exponential Moving Average (10)"]) || "N/A",
            ema20: parseFloat(stockData["Exponential Moving Average (20)"]) || "N/A",
            ema30: parseFloat(stockData["Exponential Moving Average (30)"]) || "N/A",
            ema50: parseFloat(stockData["Exponential Moving Average (50)"]) || "N/A",
            ema100: parseFloat(stockData["Exponential Moving Average (100)"]) || "N/A",
            ema200: parseFloat(stockData["Exponential Moving Average (200)"]) || "N/A",
            sma5: parseFloat(stockData["Simple Moving Average (5)"]) || "N/A",
            sma10: parseFloat(stockData["Simple Moving Average (10)"]) || "N/A",
            sma20: parseFloat(stockData["Simple Moving Average (20)"]) || "N/A",
            sma30: parseFloat(stockData["Simple Moving Average (30)"]) || "N/A",
            sma50: parseFloat(stockData["Simple Moving Average (50)"]) || "N/A",
            sma100: parseFloat(stockData["Simple Moving Average (100)"]) || "N/A",
            sma200: parseFloat(stockData["Simple Moving Average (200)"]) || "N/A",
            atr14: parseFloat(stockData["Average True Range (14)"]) || "N/A",
            marketCap: stockData["Market Capitalization"] || "N/A",
            sector: stockData.Sector || "N/A",
            industry: stockData.Industry || "N/A",
            type: stockData.Type || "N/A",
            subType: stockData["Sub Type"] || "N/A",
            priceScale: stockData["Price Scale"] || "N/A",
            minMov: stockData["Min Mov"] || "N/A",
            fractional: stockData.Fractional || "N/A",
            currency: stockData.Currency || "N/A",
        };
    }

    return null; // Return null if no data is found for the stockId
};
