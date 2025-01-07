import React, { useState, useEffect } from 'react';
import './portfolio.css';
import { useNavigate } from 'react-router-dom';

export default function Portfolio() {
    const [portfolio, setPortfolio] = useState(() => JSON.parse(localStorage.getItem('portfolio')) || []);
    const [selectedStock, setSelectedStock] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        // Update portfolio from localStorage
        setPortfolio(JSON.parse(localStorage.getItem('portfolio')) || []);
    }, []);

    const removeFromPortfolio = (stock) => {
        const updatedPortfolio = portfolio.filter(item => item["d"][0] !== stock["d"][0]);
        setPortfolio(updatedPortfolio);
        localStorage.setItem('portfolio', JSON.stringify(updatedPortfolio));
    };

    const openModal = (stock) => {
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedStock(null);
        setIsModalOpen(false);
    };

    const goToHomePage = () => {
        navigate('/');
    };

    const goToStockDetails = () => {
        if (selectedStock) {
            const stockId = selectedStock["d"][0];
            navigate(`/stock-details/${stockId}`);
        }
    };

    // Get unique sectors and industries from the portfolio for filtering
    const uniqueSectors = [...new Set(portfolio.map(stock => stock["d"][9]))];
    const uniqueIndustries = [...new Set(portfolio.map(stock => stock["d"][10]))];

    // Filter stocks in the portfolio based on search term, sector, and industry
    const filteredPortfolio = portfolio.filter((stock) => {
        const name = stock["d"][1].toLowerCase();
        const sector = stock["d"][9];
        const industry = stock["d"][10];
        
        return (
            name.includes(searchTerm.toLowerCase()) &&
            (selectedSector === '' || sector === selectedSector) &&
            (selectedIndustry === '' || industry === selectedIndustry)
        );
    });

    if (portfolio.length === 0) {
        return <p className="portfolio-empty">Your portfolio is empty. Add stocks to monitor them here!</p>;
    }

    return (
        <div className="portfolio-page">
            <header className="header">
                <h1 className="header-title">My Portfolio</h1>
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
                <button className="portfolio-button" onClick={goToHomePage}>Home Page</button>
            </header>

            <div className="stocks-container">
                {filteredPortfolio.map((stock, index) => {
                    const name = stock["d"][1];
                    const close = stock["d"][2];
                    const change = stock["d"][6] ?? 0;
                    const changePercent = stock["d"][7] ?? 0;

                    return (
                        <div key={index} className="stock-card" onClick={() => openModal(stock)}>
                            <h3 className="stock-name" data-fullname={name}>{name}</h3>
                            <p className="stock-price">{close.toFixed(2)}</p>
                            <p className={`stock-change ${change < 0 ? 'negative' : 'positive'}`}>
                                {change.toFixed(2)} ({changePercent.toFixed(2)}%)
                            </p>
                            <button className="remove-button" onClick={(e) => { e.stopPropagation(); removeFromPortfolio(stock); }}>
                                Remove from Portfolio
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Modal for showing stock details */}
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
