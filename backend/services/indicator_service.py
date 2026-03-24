"""
Technical Indicators Service
Calculates technical analysis indicators (SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic)
"""

import numpy as np
from typing import Dict, List, Tuple


class TechnicalIndicators:
    """Calculate various technical indicators from price data"""

    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> List[float]:
        """
        Simple Moving Average
        Args:
            prices: List of closing prices
            period: Number of periods for the average (e.g., 20, 50, 200)
        Returns:
            List of SMA values
        """
        if len(prices) < period:
            return []
        
        sma = []
        for i in range(len(prices) - period + 1):
            avg = np.mean(prices[i : i + period])
            sma.append(float(avg))
        return sma

    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> List[float]:
        """
        Exponential Moving Average
        Args:
            prices: List of closing prices
            period: Number of periods for the average
        Returns:
            List of EMA values
        """
        if len(prices) < period:
            return []
        
        ema = []
        multiplier = 2 / (period + 1)
        
        # First EMA is SMA
        sma = np.mean(prices[:period])
        ema.append(float(sma))
        
        # Calculate EMA for remaining prices
        for price in prices[period:]:
            ema_val = (price - ema[-1]) * multiplier + ema[-1]
            ema.append(float(ema_val))
        
        return ema

    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> List[float]:
        """
        Relative Strength Index
        Measures momentum and magnitude of price changes (0-100 scale)
        Args:
            prices: List of closing prices
            period: Period for RSI calculation (default 14)
        Returns:
            List of RSI values
        """
        if len(prices) < period + 1:
            return []
        
        deltas = np.diff(prices)
        seed = deltas[: period + 1]
        
        up = seed[seed >= 0].sum() / period
        down = -seed[seed < 0].sum() / period
        
        rsi = []
        
        rs = up / down if down != 0 else 0
        rsi_val = 100.0 - 100.0 / (1.0 + rs) if rs != 0 else 50
        rsi.append(float(rsi_val))
        
        # Calculate RSI for remaining prices
        for delta in deltas[period:]:
            if delta > 0:
                up = (up * (period - 1) + delta) / period
                down = (down * (period - 1)) / period
            else:
                up = (up * (period - 1)) / period
                down = (down * (period - 1) - delta) / period
            
            rs = up / down if down != 0 else 0
            rsi_val = 100.0 - 100.0 / (1.0 + rs) if rs != 0 else 50
            rsi.append(float(rsi_val))
        
        return rsi

    @staticmethod
    def calculate_macd(
        prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9
    ) -> Dict[str, List[float]]:
        """
        MACD (Moving Average Convergence Divergence)
        Trend-following momentum indicator
        Args:
            prices: List of closing prices
            fast: Fast EMA period (default 12)
            slow: Slow EMA period (default 26)
            signal: Signal line EMA period (default 9)
        Returns:
            Dict with 'macd', 'signal', and 'histogram' keys
        """
        if len(prices) < slow:
            return {"macd": [], "signal": [], "histogram": []}
        
        ema_fast = TechnicalIndicators.calculate_ema(prices, fast)
        ema_slow = TechnicalIndicators.calculate_ema(prices, slow)
        
        # MACD line = fast EMA - slow EMA
        macd_line = []
        for i in range(len(ema_slow)):
            idx = len(ema_fast) - len(ema_slow) + i
            diff = ema_fast[idx] - ema_slow[i]
            macd_line.append(float(diff))
        
        # Signal line = 9-period EMA of MACD
        signal_line = TechnicalIndicators.calculate_ema(macd_line, signal) if len(macd_line) >= signal else []
        
        # Histogram = MACD - Signal
        histogram = []
        for i in range(len(signal_line)):
            idx = len(macd_line) - len(signal_line) + i
            hist_val = macd_line[idx] - signal_line[i]
            histogram.append(float(hist_val))
        
        return {
            "macd": macd_line,
            "signal": signal_line,
            "histogram": histogram,
        }

    @staticmethod
    def calculate_bollinger_bands(
        prices: List[float], period: int = 20, std_multiplier: float = 2
    ) -> Dict[str, List[float]]:
        """
        Bollinger Bands
        Volatility indicator with upper/middle/lower bands
        Args:
            prices: List of closing prices
            period: Period for moving average (default 20)
            std_multiplier: Standard deviations from mean (default 2)
        Returns:
            Dict with 'upper', 'middle', 'lower' bands
        """
        if len(prices) < period:
            return {"upper": [], "middle": [], "lower": []}
        
        middle = TechnicalIndicators.calculate_sma(prices, period)
        
        upper = []
        lower = []
        
        for i in range(len(middle)):
            start_idx = i
            end_idx = i + period
            period_prices = prices[start_idx:end_idx]
            
            std = np.std(period_prices)
            upper.append(float(middle[i] + (std * std_multiplier)))
            lower.append(float(middle[i] - (std * std_multiplier)))
        
        return {
            "upper": upper,
            "middle": middle,
            "lower": lower,
        }

    @staticmethod
    def calculate_stochastic(
        high: List[float], low: List[float], close: List[float], period: int = 14
    ) -> Dict[str, List[float]]:
        """
        Stochastic Oscillator
        Momentum indicator comparing price to range (0-100 scale)
        Args:
            high: List of high prices
            low: List of low prices
            close: List of closing prices
            period: Period for stochastic (default 14)
        Returns:
            Dict with '%K' and '%D' (signal line)
        """
        if len(close) < period:
            return {"%k": [], "%d": []}
        
        k_values = []
        
        for i in range(len(close) - period + 1):
            high_max = np.max(high[i : i + period])
            low_min = np.min(low[i : i + period])
            
            if high_max == low_min:
                k = 50.0
            else:
                k = ((close[i + period - 1] - low_min) / (high_max - low_min)) * 100
            
            k_values.append(float(k))
        
        # %D is 3-period SMA of %K
        d_values = TechnicalIndicators.calculate_sma(k_values, 3) if len(k_values) >= 3 else []
        
        return {"%k": k_values, "%d": d_values}

    @staticmethod
    def get_all_indicators(
        prices: List[float],
        high: List[float] = None,
        low: List[float] = None,
    ) -> Dict:
        """
        Calculate all technical indicators at once
        Args:
            prices: List of closing prices
            high: List of high prices (for stochastic)
            low: List of low prices (for stochastic)
        Returns:
            Dict containing all indicator data
        """
        indicators = {
            "sma_20": TechnicalIndicators.calculate_sma(prices, 20),
            "sma_50": TechnicalIndicators.calculate_sma(prices, 50),
            "sma_200": TechnicalIndicators.calculate_sma(prices, 200),
            "ema_12": TechnicalIndicators.calculate_ema(prices, 12),
            "ema_26": TechnicalIndicators.calculate_ema(prices, 26),
            "rsi": TechnicalIndicators.calculate_rsi(prices, 14),
            "macd": TechnicalIndicators.calculate_macd(prices),
            "bollinger": TechnicalIndicators.calculate_bollinger_bands(prices, 20, 2),
        }
        
        if high and low and len(high) == len(low) == len(prices):
            indicators["stochastic"] = TechnicalIndicators.calculate_stochastic(high, low, prices, 14)
        
        return indicators
