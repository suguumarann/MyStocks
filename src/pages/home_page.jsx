import React, { useEffect, useState } from 'react';
import { fetchEod } from '../utils/web-service';
import './home_page.css';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
    const [eod, setEod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [selectedStock, setSelectedStock] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [portfolio, setPortfolio] = useState(() => JSON.parse(localStorage.getItem('portfolio')) || []);

    const navigate = useNavigate();

    useEffect(() => {
        async function call() {
            const data = await fetchEod();  // Fetch data from CSV file
            const filteredData = data["data"].filter((stock) => {
                const volume = stock['d'][8];
                return volume >= 0;
            });
            setEod({ ...data, data: filteredData });
        }
        call();
    }, []);

    if (eod === null) {
        return (
            <div className="loading-container" style={{
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
                <p className="loading-message">Loading...</p>
                <div
                    style={{
                        width: '50px',
                        height: '50px',
                        marginLeft: '767px',
                        border: '5px solid rgba(255, 255, 255, 0.2)',
                        borderTopColor: '#00d2ff',
                        borderRadius: '50%',
                        animation: 'spin 1s infinite linear',
                        marginBottom: '20px',
                    }}
                ></div>

            </div>
        );
    }    

    const goToStockDetails = () => {
        if (selectedStock) {
            const stockId = selectedStock["d"][0];
            navigate(`/stock-details/${stockId}`);
        }
    };

    const addToPortfolio = (stock) => {
        const updatedPortfolio = [...portfolio, stock];
        setPortfolio(updatedPortfolio);
        localStorage.setItem('portfolio', JSON.stringify(updatedPortfolio));
    };

    const removeFromPortfolio = (stock) => {
        const updatedPortfolio = portfolio.filter(item => item["d"][0] !== stock["d"][0]);
        setPortfolio(updatedPortfolio);
        localStorage.setItem('portfolio', JSON.stringify(updatedPortfolio));
    };

    const isStockInPortfolio = (stockId) => {
        return portfolio.some(stock => stock["d"][0] === stockId);
    };

    // Get unique sectors and industries for dropdown options
    const uniqueSectors = [...new Set(eod["data"].map(stock => stock["d"][9]))];  // updated to reflect correct field for Sector
    const uniqueIndustries = [...new Set(eod["data"].map(stock => stock["d"][10]))];  // updated for Industry

    // Filter stocks based on search term, sector, and industry
    const filteredStocks = eod["data"].filter((stock) => {
        const name = stock["d"][1].toLowerCase();
        const sector = stock["d"][9]; // updated for Sector
        const industry = stock["d"][10]; // updated for Industry
        
        return (
            name.includes(searchTerm.toLowerCase()) &&
            (selectedSector === '' || sector === selectedSector) &&
            (selectedIndustry === '' || industry === selectedIndustry)
        );
    });

    const openModal = (stock) => {
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedStock(null);
        setIsModalOpen(false);
    };

    const goToPortfolio = () => {
        navigate('/portfolio');
    };

    return (
        <div className="home-page">
            <header className="header">
                <h1 className="header-title">MY Stocks</h1>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="Search Stocks..."
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {/* Sector filter */}
                    <select
                        className="filter-dropdown"
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                    >
                        <option value="">All Sectors</option>
                        {uniqueSectors.map((sector, index) => (
                            <option key={index} value={sector}>{sector}</option>
                        ))}
                    </select>

                    {/* Industry filter */}
                    <select
                        className="filter-dropdown"
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                    >
                        <option value="">All Industries</option>
                        {uniqueIndustries.map((industry, index) => (
                            <option key={index} value={industry}>{industry}</option>
                        ))}
                    </select>
                </div>
                <button className="portfolio-button" onClick={goToPortfolio}>My Portfolio</button>
            </header>

            <div className="stocks-container">
                {filteredStocks.map((stock, index) => {
                    const name = stock["d"][1];
                    const close = stock["d"][2];
                    const change = stock["d"][6] ?? 0;
                    const changePercent = stock["d"][7] ?? 0;
                    const stockId = stock["d"][0];

                    return (
                        <div key={index} className="stock-card" onClick={() => openModal(stock)}>
                            <h3 className="stock-name" data-fullname={name}>{name}</h3>
                            <p className="stock-price">{close.toFixed(2)}</p>
                            <p className={`stock-change ${change < 0 ? 'negative' : 'positive'}`}>
                                {change.toFixed(2)} ({changePercent.toFixed(2)}%)
                            </p>
                            {isStockInPortfolio(stockId) ? (
                                <button className="remove-button" onClick={(e) => { e.stopPropagation(); removeFromPortfolio(stock); }}>Remove from Portfolio</button>
                            ) : (
                                <button className="add-button" onClick={(e) => { e.stopPropagation(); addToPortfolio(stock); }}>Add to Portfolio</button>
                            )}
                        </div>
                    );
                })}
            </div>

            {isModalOpen && selectedStock && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={closeModal}>X</button>
                        <h2 className="modal-title">{selectedStock["d"][1]}</h2> {/* Stock Name */}
                        <p><strong>Close Price:</strong> {selectedStock["d"][2].toFixed(2)}</p>
                        <p><strong>Open Price:</strong> {selectedStock["d"][3].toFixed(2)}</p>
                        <p><strong>High Price:</strong> {selectedStock["d"][4].toFixed(2)}</p>
                        <p><strong>Low Price:</strong> {selectedStock["d"][5].toFixed(2)}</p>
                        <p><strong>Volume:</strong> {selectedStock["d"][8]}</p>
                        <p><strong>Sector:</strong> {selectedStock["d"][9]}</p>
                        <p><strong>Industry:</strong> {selectedStock["d"][10]}</p>
                        <button className="more-details-button" onClick={goToStockDetails}>More Details</button>
                    </div>
                </div>
            )}
        </div>
    );
}
