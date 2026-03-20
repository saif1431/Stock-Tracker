import React, { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketMessage {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export function useStockWebSocket(symbol: string | null, onMessage?: (data: any) => void) {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const host = apiUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
    const socketUrl = `${host}/ws/stock/${symbol}`;

    console.log(`Connecting to WebSocket: ${socketUrl}`);
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        setData(messageData);
        if (onMessage) onMessage(messageData);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error');
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [symbol, onMessage]);

  return { data, isConnected, error };
}
