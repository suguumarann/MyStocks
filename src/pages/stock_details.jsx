import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStockHistory, fetchStockHistory1M, fetchStockHistory2M, fetchStockHistory3M, fetchEod } from '../utils/web-service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './stock_details.css';

export default function StockDetails() {
    const { stockId } = useParams();
    const [stockHistory, setStockHistory] = useState([]);
    const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
    const [currentPrice, setCurrentPrice] = useState(null);
    const [previousClose, setPreviousClose] = useState(null);
    const [priceChange, setPriceChange] = useState(null);
    const [priceChangePercent, setPriceChangePercent] = useState(null);
    const [randomStocks, setRandomStocks] = useState([]);
    const [selectedSector, setSelectedSector] = useState('');
    const [sectors, setSectors] = useState([]);
    const navigate = useNavigate();
    const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
    const itemsPerBatch = 21; // Number of stocks per batch
    const [countdown, setCountdown] = useState(10);
    const [progress, setProgress] = useState(100);

    const totalStocks = randomStocks.slice(
        currentBatchIndex * itemsPerBatch,
        (currentBatchIndex + 1) * itemsPerBatch
    );
    
    let leftStocks = [];
    let middleStocks = [];
    let rightStocks = [];
    
    if (totalStocks.length <= 7) {
        // If 7 or fewer stocks, populate them all in the middle column
        middleStocks = totalStocks;
    } else {
        // Determine middle column count
        let middleCount = Math.min(7, totalStocks.length);
    
        // Calculate remaining stocks for left and right columns
        let remaining = totalStocks.length - middleCount;
        let leftCount = Math.floor(remaining / 2);
        let rightCount = remaining - leftCount;
    
        // If left and right are not balanced, adjust by taking one from the middle
        if (leftCount !== rightCount) {
            if (leftCount < rightCount) {
                leftCount++;
                middleCount--;
            } else {
                rightCount++;
                middleCount--;
            }
        }
    
        // Assign stocks to columns
        middleStocks = totalStocks.slice(0, middleCount);
        leftStocks = totalStocks.slice(middleCount, middleCount + leftCount);
        rightStocks = totalStocks.slice(middleCount + leftCount);
    }    

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown((prevCountdown) => (prevCountdown > 1 ? prevCountdown - 1 : 10));
            setProgress((prevProgress) =>
                prevProgress > 0 ? prevProgress - (100 / 9) : 100
            );
    
            if (countdown === 1) {
                // When the countdown reaches 1, update the current batch and ensure it reflects the selected sector
                setCurrentBatchIndex((prevIndex) => {
                    const nextIndex =
                        (prevIndex + 1) * itemsPerBatch < randomStocks.length
                            ? prevIndex + 1
                            : 0;
                    return nextIndex;
                });
    
                // Reload stocks for the current sector
                fetchEod().then((data) => {
                    if (data && data.data) {
                        const filteredStocks = data.data.filter(
                            (stock) => stock.d[9] === selectedSector
                        );
                        setRandomStocks(filteredStocks.slice(0, 1000));
                    }
                });
            }
        }, 1000);
    
        return () => clearInterval(interval);
    }, [countdown, randomStocks, selectedSector]); // Added `selectedSector` to dependencies    
    
    useEffect(() => {
        async function fetchHistory() {
          let history;
      
          // Call the appropriate function based on the selected timeframe
          if (selectedTimeframe === '6M') {
            history = await fetchStockHistory(stockId);
          } else if (selectedTimeframe === '3M') {
            history = await fetchStockHistory3M(stockId);
          } else if (selectedTimeframe === '2M') {
            history = await fetchStockHistory2M(stockId);
          } else if (selectedTimeframe === '1M') {
            history = await fetchStockHistory1M(stockId);
          }
      
          setStockHistory(history);
      
          // Proceed with setting price details if history data is available
          if (history && history.length > 1) {
            const latestData = history[history.length - 1];
            const previousData = history[history.length - 2];
      
            setCurrentPrice(latestData.close);
            setPreviousClose(previousData.close);
            const change = (latestData.close - previousData.close).toFixed(2);
            const percentChange = ((change / previousData.close) * 100).toFixed(2);
      
            setPriceChange(change);
            setPriceChangePercent(percentChange);
          }
        }
      
        fetchHistory();
      }, [stockId, selectedTimeframe]);      

      useEffect(() => {
        async function fetchRandomStocks() {
            const data = await fetchEod(); // Fetch all stock data
    
            if (data && data.data) {
                const currentStock = data.data.find(stock => stock.d[0] === stockId);
    
                if (currentStock) {
                    const defaultSector = currentStock?.d[9] || ''; // Assuming sector is at index 9
                    setSelectedSector(defaultSector);
    
                    // Extract unique sectors
                    const sectorsList = [...new Set(data.data.map(stock => stock.d[9]))];
                    setSectors(sectorsList);
    
                    // Filter stocks based on selected sector
                    const filteredStocks = data.data.filter(stock => stock.d[9] === defaultSector);
    
                    // Shuffle and set random stocks
                    const shuffledStocks = filteredStocks.sort(() => Math.random() - 0.5);
                    setRandomStocks(shuffledStocks.slice(0, 1000));
                }
            }
        }
        fetchRandomStocks();
    }, [stockId]);    

    const handleTimeframeChange = (timeframe) => {
        setSelectedTimeframe(timeframe);
    };

    const goToStockDetails = (stockId) => {
        navigate(`/stock-details/${stockId}`);
    };

    const handleSectorChange = (event) => {
        const sector = event.target.value;
        setSelectedSector(sector);

        // Update stocks based on new sector selection
        fetchEod().then(data => {
            const filteredStocks = data.data.filter(stock => stock.d[9] === sector);
            setRandomStocks(filteredStocks.slice(0, 1000));
        });
    };

    return (
        <div className="stock-details-container" >
            <div className="stock-details-main">
                <div className="stock-header">
                <h2>Stock Details for {stockId}</h2>
                    <div className="price-info">
                        <p className="current-price">MYR {currentPrice}</p>
                        <div className="price-details">
                            <p className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                                {priceChange >= 0 ? '↑' : '↓'} MYR {priceChange} ({priceChangePercent}%)
                            </p>
                            <p className="previous-close">Prev close: MYR {previousClose}</p>
                        </div>
                    </div>
                </div>

                {stockHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={360}>
                        <LineChart data={stockHistory}>
                            <CartesianGrid stroke="#383838" />
                            <XAxis dataKey="date" stroke="#c0c0c0" />
                            <YAxis stroke="#c0c0c0" />
                            <Tooltip content={({ payload }) => {
                                if (payload && payload.length) {
                                    const { date, open, close } = payload[0].payload;
                                    return (
                                        <div style={{ color: '#ffffff', padding: '8px', textAlign: 'center' }}>
                                            <p>{date}</p>
                                            <p style={{ color: '#00e676' }}>Open: {open}</p>
                                            <p style={{ color: '#00e676' }}>Close: {close}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            wrapperStyle={{
                                border: "2px #C0C0C0 solid",
                                outline: "none",
                                backgroundColor: '#333333',
                                borderRadius: '10px',
                                padding: '0px',
                                boxShadow: 'inset 0 0 0 1px #606060, 0 2px 8px rgba(0, 0, 0, 0.3)', // Inset border effect
                            }}
                            contentStyle={{ backgroundColor: '#333333', borderRadius: '10px', color: '#ffffff' }} />
                            <Line type="monotone" dataKey="close" stroke="#00e676" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="loading-message">Loading stock history...</div>
                )}

                <div style={{
                    display: 'flex',
                    width: "100%",
                    marginTop: "60px"
                }}> 
                                        <div className="timeframe-buttons">
                    {['1M', '2M'].map((timeframe) => (
                        <button
                        key={timeframe}
                        className={`timeframe-button ${
                            selectedTimeframe === timeframe ? 'active' : ''
                        }`}
                        onClick={() => handleTimeframeChange(timeframe)}
                        >
                        {timeframe}
                        </button>
                    ))}
                    </div>
                    <div style={{ flex: 1.1}} />
                    <button
                        style={{
                            background: 'linear-gradient(135deg, #007bff, #00d2ff)',
                            color: '#ffffff',
                            padding: '10px 20px',
                            marginBottom: '20px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: 'none',
                            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                        onClick={() => navigate(`/stock-prediction/${stockId}`)}
                    >
                        Stock Prediction
                    </button>
                    <div style={{ flex: 1 }} />
                    <div className="timeframe-buttons">
                    {['3M', '6M'].map((timeframe) => (
                        <button
                        key={timeframe}
                        className={`timeframe-button ${
                            selectedTimeframe === timeframe ? 'active' : ''
                        }`}
                        onClick={() => handleTimeframeChange(timeframe)}
                        >
                        {timeframe}
                        </button>
                    ))}
                    </div>
                </div>
            </div>

            <div className="random-stocks-side right-side">
            <div style={{ height: '6vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div
        style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '10px',
            animation: 'fadeInOut 1s linear infinite',
        }}
    >
        Refreshing in {countdown}s
    </div>
    <div
        style={{
            width: '90%',
            height: '8px',
            backgroundColor: '#444',
            borderRadius: '5px',
            overflow: 'hidden',
        }}
    >
        <div
            style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00e676, #00b0ff)',
                transition: 'width 1s linear',
            }}
        ></div>
    </div>
</div>

    {leftStocks.map((stock, index) => (
            <div key={index} className="random-stock-card" onClick={() => goToStockDetails(stock["d"][0])}>
                <h4 className="random-stock-name">{stock["d"][1]}</h4>
                <p className="random-stock-price">MYR {stock["d"][2].toFixed(2)}</p>
            </div>
        ))}
</div>

            {/* Additional stock sections, if needed */}
            <div className="random-stocks-side right-side">
            <div style={{ display: 'flex', alignItems: 'center' }}>
            <select
    value={selectedSector || ''}
    onChange={handleSectorChange}
    className="sector-filter-dropdown"
>
    {sectors.map((sector, index) => (
        <option key={index} value={sector}>{sector}</option>
    ))}
</select>

                    </div>
                    
                    {middleStocks.map((stock, index) => (
            <div key={index} className="random-stock-card" onClick={() => goToStockDetails(stock["d"][0])}>
                <h4 className="random-stock-name">{stock["d"][1]}</h4>
                <p className="random-stock-price">MYR {stock["d"][2].toFixed(2)}</p>
            </div>
        ))}
            </div>
            {/* Additional stock sections, if needed */}
            <div className="random-stocks-side right-side">
            <div style={{ height: '6vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div
        style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '10px',
            animation: 'fadeInOut 1s linear infinite',
        }}
    >
        Refreshing in {countdown}s
    </div>
    <div
        style={{
            width: '90%',
            height: '8px',
            backgroundColor: '#444',
            borderRadius: '5px',
            overflow: 'hidden',
        }}
    >
        <div
            style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00e676, #00b0ff)',
                transition: 'width 1s linear',
            }}
        ></div>
    </div>
</div>

{rightStocks.map((stock, index) => (
            <div key={index} className="random-stock-card" onClick={() => goToStockDetails(stock["d"][0])}>
                <h4 className="random-stock-name">{stock["d"][1]}</h4>
                <p className="random-stock-price">MYR {stock["d"][2].toFixed(2)}</p>
            </div>
        ))}
</div>

        </div>
    );
}

