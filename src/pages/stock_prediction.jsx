import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchStockDetails } from '../utils/web-service'; // Import the fetchStockDetails function
import './stock_prediction.css';

export default function StockPrediction() {
    const { stockId } = useParams();
    const [predictionData, setPredictionData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Fetching prediction data from server...");
    const [selectedTimeframe, setSelectedTimeframe] = useState(8); // Default is 1 Week (8 days)
    const [stockDetails, setStockDetails] = useState({}); // State for stock details
    const [currentNewsIndex, setCurrentNewsIndex] = useState(0); // Track current news item index
    const [tickerStarted, setTickerStarted] = useState(false);

    useEffect(() => {
        if (!loading) {
            setTickerStarted(true); // Start the ticker after loading is complete
        }
    }, [loading]);    

    const timeframes = [
        { label: '1 Week', days: 8 },
        { label: '2 Weeks', days: 15 },
        { label: '1 Month', days: 31 },
        { label: '2 Months', days: 61 },
    ];

    useEffect(() => {
        const messages = [
            "Fetching prediction data from server...",
            "Preparing stock details for analysis...",
            "Analyzing trends and processing data...",
            "Rendering prediction graph, please wait..."
        ];
        let messageIndex = 0;

        const interval = setInterval(() => {
            if (messageIndex < messages.length) {
                setLoadingMessage(messages[messageIndex]);
                messageIndex++;
            }
        }, 3000); // Change message every 3 seconds

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    useEffect(() => {
        const fetchPredictionData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:5000/api/predict/${stockId}`);
                
                if (!response.ok) {
                    console.error('No prediction data available for this stock.');
                    setPredictionData([]);
                    return;
                }

                const data = await response.json();
                setPredictionData(data.predictions || []);
            } catch (error) {
                console.error('Error fetching prediction data:', error);
                setPredictionData([]);
            }
            setLoading(false);
        };

        fetchPredictionData();
    }, [stockId]);

    useEffect(() => {
        const fetchDetails = async () => {
            const details = await fetchStockDetails(stockId); // Fetch stock details
            setStockDetails(details || {}); // Set the stock details or an empty object if no data
        };

        fetchDetails();
    }, [stockId]);

    const filteredPredictionData = predictionData.slice(0, selectedTimeframe);

    const stockNews = stockDetails
    ? [
        `${stockDetails.description} Details`,
        `Current Price: ${stockDetails.price} ${stockDetails.currency || ''}`,
        `Close Price: ${stockDetails.price}, Open Price: ${stockDetails.open}, High Price: ${stockDetails.high}, Low Price: ${stockDetails.low}`,
        `Volume: ${stockDetails.volume}, Price Change: ${stockDetails.change}, Price Change Percentage: ${stockDetails.changePercent}%`,
        `Pre-Market Volume: ${stockDetails.preMarketVolume}, Pre-Market Price Change: ${stockDetails.preMarketChange}, Pre-Market Price Change Percentage: ${stockDetails.preMarketChangePercent}%`,
        `Post-Market Volume: ${stockDetails.postMarketVolume}, Post-Market Price Change: ${stockDetails.postMarketChange}, Post-Market Price Change Percentage: ${stockDetails.postMarketChangePercent}%`,
        `EMA (10): ${stockDetails.ema10}, EMA (20): ${stockDetails.ema20}, EMA (30): ${stockDetails.ema30}, EMA (50): ${stockDetails.ema50}, EMA (100): ${stockDetails.ema100}, EMA (200): ${stockDetails.ema200}`,
        `SMA (10): ${stockDetails.sma10}, SMA (20): ${stockDetails.sma20}, SMA (30): ${stockDetails.sma30}, SMA (50): ${stockDetails.sma50}, SMA (100): ${stockDetails.sma100}, SMA (200): ${stockDetails.sma200}`,
        `Average True Range (ATR-14): ${stockDetails.atr14}`,
        `Market Capitalization: ${stockDetails.marketCap}`,
        `Sector: ${stockDetails.sector}, Industry: ${stockDetails.industry}`,
        `Type: ${stockDetails.type}, Sub-Type: ${stockDetails.subType}`,
        `Price Scale: ${stockDetails.priceScale}, Minimum Movement: ${stockDetails.minMov}, Fractional: ${stockDetails.fractional}`,
    ].filter(Boolean)
    : ["No details available for the selected stock."];

    useEffect(() => {
        if (!tickerStarted) return; // Exit early if the ticker hasn't started
    
        const interval = setInterval(() => {
            setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % stockNews.length);
        }, 5000);
    
        return () => clearInterval(interval); // Cleanup on unmount
    }, [tickerStarted, stockNews.length]);    

    if (loading) {
        return (
            <div className="loading-overlay" style={{
                backgroundImage: `url('https://images.pexels.com/photos/14708425/pexels-photo-14708425.jpeg?auto=compress&cs=tinysrgb&w=600')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100%',
                position: 'fixed',
                top: '0',
                left: '0',
                zIndex: '9999',
            }}>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-message">{loadingMessage}</p>
                    <div className="loading-progress-bar">
                        <div className="progress" style={{ animation: "progressBarAnimation 20s linear" }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="prediction-page" style={{
                backgroundImage: `url('https://images.pexels.com/photos/14708425/pexels-photo-14708425.jpeg?auto=compress&cs=tinysrgb&w=600')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100%',
                position: 'fixed',
                top: '0',
                left: '0',
                zIndex: '9999',
            }}>
            <h2>Stock Prediction for {stockId}</h2>

            {/* Timeframe Selector Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
                {timeframes.map((timeframe) => (
                    <button
                        key={timeframe.days}
                        className={`timeframe-button ${selectedTimeframe === timeframe.days ? 'active' : ''}`}
                        onClick={() => setSelectedTimeframe(timeframe.days)}
                    >
                        {timeframe.label}
                    </button>
                ))}
            </div>

            {filteredPredictionData.length > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="55%" height={440}>
                    <LineChart data={filteredPredictionData}>
                        <defs>
                            <linearGradient id="predictionGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#007bff" />
                                <stop offset="100%" stopColor="#00d2ff" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#333" />
                        <XAxis dataKey="date" stroke="#ccc" />
                        <YAxis stroke="#ccc" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#333333',
                                borderRadius: '10px',
                                color: '#ffffff',
                            }}
                            wrapperStyle={{
                                border: "2px #C0C0C0 solid",
                                outline: "none",
                                backgroundColor: '#333333',
                                borderRadius: '10px',
                                padding: '0px',
                                boxShadow: 'inset 0 0 0 1px #606060, 0 2px 8px rgba(0, 0, 0, 0.3)',
                            }}
                        />
                        <Line type="monotone" dataKey="predictedPrice" stroke="url(#predictionGradient)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>            
            ) : (
                <p className="no-prediction-message">
        No prediction data available for this stock.
    </p>
            )}

           {/* News ticker at the bottom */}
        {tickerStarted && (
            <div className="news-ticker">
                <div className="ticker-content">
                    <span className="ticker-item">{stockNews[currentNewsIndex]}</span>
                </div>
            </div>
        )}
        </div>
    );
}
