from flask import Flask, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
import os
from glob import glob

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/predict/<stock_id>', methods=['GET'])
def predict(stock_id):
    try:
        # Define paths for model and scaler
        model_path = f'public/models/{stock_id}_model'
        scaler_path = f'public/models/{stock_id}_scaler.pkl'
        
        # Check if model and scaler exist
        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            return jsonify({"error": f"No model or scaler found for stock ID {stock_id}"}), 404
        
        # Load model and scaler
        model = load_model(model_path)
        scaler = joblib.load(scaler_path)

        # Gather the last 60 closing prices for the stock from CSV files
        csv_files = sorted(glob('public/eod_myx/*.csv'), reverse=True)  # Load most recent files first
        closing_prices = []

        for file in csv_files:
            if len(closing_prices) >= 60:
                break  # Stop once we have 60 days of data
            
            # Load the daily CSV
            data = pd.read_csv(file)

            # Check if the 'Ticker' and 'Price' columns exist
            if 'Ticker' not in data.columns or 'Price' not in data.columns:
                print(f"Required columns not found in {file}")
                continue

            # Filter for the specified stock ID
            stock_data = data[data['Ticker'] == stock_id]
            if not stock_data.empty:
                # Append the 'Price' values (interpreted as 'close' price) to the closing prices list
                closing_prices.extend(stock_data['Price'].tolist())
        
        # Ensure we have exactly 60 days of data
        if len(closing_prices) < 60:
            return jsonify({"error": f"Not enough data for stock ID {stock_id}"}), 404

        # Reverse the list to have the latest prices at the end
        closing_prices = closing_prices[:60][::-1]
        last_known_price = closing_prices[-1]  # This is the latest closing price (e.g., 1.8 for AAX)

        # Scale the data
        last_60_days = np.array(closing_prices).reshape(-1, 1)
        last_60_days_scaled = scaler.transform(last_60_days)
        X_test = np.reshape(last_60_days_scaled, (1, last_60_days_scaled.shape[0], 1))

        # Generate predictions for the next 60 days
        predictions = [last_known_price]  # Start with the last known price
        for _ in range(60):  # Predict for the next 60 days
            predicted_price_scaled = model.predict(X_test)[0][0]
            
            # Transform the scaled prediction back to the original scale
            predicted_price = scaler.inverse_transform([[predicted_price_scaled]])[0][0]
            predictions.append(predicted_price)  # Add the actual (unscaled) predicted price

            # Update X_test to add the scaled predicted price and remove the first element
            predicted_price_scaled_reshaped = np.array(predicted_price_scaled).reshape((1, 1, 1))
            X_test = np.append(X_test[:, 1:, :], predicted_price_scaled_reshaped, axis=1)

        # Create response with dates, starting from Day 0 with the actual last known price
        prediction_data = [{"date": f"Day {i}", "predictedPrice": pred} for i, pred in enumerate(predictions)]
        return jsonify({"predictions": prediction_data})

    except Exception as e:
        # Log the error and return a detailed message
        print(f"Error processing stock ID {stock_id}: {str(e)}")
        return jsonify({"error": f"An error occurred while processing stock ID {stock_id}: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(port=5000)
