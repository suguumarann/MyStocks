# Importing necessary libraries for data processing, machine learning, and memory management
import os  # For handling file paths and directories
import numpy as np  # For numerical computations and array handling
import pandas as pd  # For data manipulation and loading CSV files
from sklearn.preprocessing import MinMaxScaler  # For normalizing data between 0 and 1
from tensorflow.keras.models import Sequential  # For creating the LSTM model
from tensorflow.keras.layers import Dense, LSTM  # LSTM layers and dense layers for prediction
import joblib  # For saving the trained scaler for later use
import gc  # For garbage collection to free up memory

# Function to load data from CSV files and prepare it for model training
def load_data(stock_id, folder_path='public/eod_myx', time_step=60):
    # List all CSV files in the specified folder
    all_files = sorted([f for f in os.listdir(folder_path) if f.endswith('.csv')])
    data = []  # List to store data for the given stock ID

    # Loop through each file to extract stock data
    for file in all_files:
        try:
            # Extract the date from the filename for proper time series ordering
            date_from_filename = pd.to_datetime(file.split(".")[0], format='%Y%m%d')
            df = pd.read_csv(os.path.join(folder_path, file))
            
            # Filter data for the specified stock ID
            stock_data = df[df['Ticker'] == stock_id]
            
            # If data for the stock is found, append it with the date
            if not stock_data.empty:
                stock_data['Date'] = date_from_filename
                data.append(stock_data[['Price', 'Date']])

            # Clear memory after processing each file
            del df
            gc.collect()

        # Handle any file reading errors and continue processing other files
        except pd.errors.ParserError:
            print(f"Error reading file {file}. Skipping this file.")
            continue

    # Return None if no data was collected for the stock ID
    if not data:
        return None, None, None

    # Combine all data into a single DataFrame and sort by date
    data = pd.concat(data).sort_values('Date')
    
    # Prepare price data for normalization and model training
    close_prices = data['Price'].values.reshape(-1, 1)
    scaler = MinMaxScaler(feature_range=(0, 1))  # Normalize prices between 0 and 1
    scaled_prices = scaler.fit_transform(close_prices)

    # Prepare training data with a specified time step (sequence length)
    X_train, y_train = [], []
    for i in range(time_step, len(scaled_prices)):
        X_train.append(scaled_prices[i - time_step:i, 0])  # Input features
        y_train.append(scaled_prices[i, 0])  # Target value

    # Handle the case where there is insufficient data for training
    if len(X_train) == 0:
        print(f"Insufficient data for stock ID '{stock_id}'. Skipping.")
        return None, None, None

    # Convert the lists into NumPy arrays and reshape the input data for the LSTM model
    X_train, y_train = np.array(X_train), np.array(y_train)
    X_train = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 1))

    # Return the prepared training data and scaler
    return X_train, y_train, scaler

# Function to build and train an LSTM model
def build_and_train_model(X_train, y_train):
    # Initializing the Sequential model for stacking layers
    model = Sequential()
    
    # Adding the first LSTM layer with 50 units and return sequences for stacking another LSTM
    model.add(LSTM(units=50, return_sequences=True, input_shape=(X_train.shape[1], 1)))
    
    # Adding the second LSTM layer without returning sequences (final output before Dense layers)
    model.add(LSTM(units=50, return_sequences=False))
    
    # Adding two dense layers for better feature extraction and output prediction
    model.add(Dense(units=25))
    model.add(Dense(units=1))  # Output layer predicting the stock price

    # Compiling the model with Adam optimizer and Mean Squared Error loss function
    model.compile(optimizer='adam', loss='mean_squared_error')

    # Training the model for 10 epochs with a batch size of 32, no progress shown (verbose=0)
    model.fit(X_train, y_train, batch_size=32, epochs=10, verbose=0)
    return model

# Main execution block for training models on multiple stock datasets
if __name__ == "__main__":
    folder_path = 'public/eod_myx'  # Folder containing stock data
    model_save_dir = 'public/models'  # Directory to save trained models
    os.makedirs(model_save_dir, exist_ok=True)  # Create the directory if it doesn't exist

    # Collecting all stock IDs from the available CSV files
    all_stock_ids = set()
    for file in os.listdir(folder_path):
        if file.endswith('.csv'):
            df = pd.read_csv(os.path.join(folder_path, file))
            all_stock_ids.update(df['Ticker'].unique())  # Add stock IDs to the set
            del df  # Clear the dataframe after processing each file
            gc.collect()

    # Looping through each stock ID to train a separate model
    for stock_id in all_stock_ids:
        # Defining paths to save the model and scaler for each stock
        model_save_path = os.path.join(model_save_dir, f"{stock_id}_model")
        scaler_save_path = os.path.join(model_save_dir, f"{stock_id}_scaler.pkl")

        # Skip training if the model and scaler already exist
        if os.path.exists(model_save_path) and os.path.exists(scaler_save_path):
            print(f"Model and scaler for stock ID '{stock_id}' already exist. Skipping.")
            continue

        # Load data for the current stock ID
        print(f"Processing stock: {stock_id}")
        X_train, y_train, scaler = load_data(stock_id, folder_path)

        # Skip the current stock if there is not enough data for training
        if X_train is None or y_train is None:
            print(f"No sufficient data for stock ID '{stock_id}'. Skipping.")
            continue

        # Build and train the LSTM model
        model = build_and_train_model(X_train, y_train)

        # Save the trained model and the scaler for future use
        model.save(model_save_path)
        print(f"Model saved for stock ID: {stock_id} at {model_save_path}")

        # Save the scaler using joblib
        joblib.dump(scaler, scaler_save_path)
        print(f"Scaler saved for stock ID: {stock_id} at {scaler_save_path}")

        # Clear memory after processing each stock to avoid memory leaks
        del X_train, y_train, scaler, model
        gc.collect()
