import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/home_page';
import StockDetails from './pages/stock_details';
import Portfolio from './pages/portfolio';
import StockPrediction from './pages/stock_prediction';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/stock-details/:stockId" element={<StockDetails />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/stock-prediction/:stockId" element={<StockPrediction />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
