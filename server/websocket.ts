import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { DashboardData } from '@shared/schema';
import { storage } from './storage';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    perMessageDeflate: false
  });

  console.log('🔌 WebSocket server initialized on /ws');

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('📡 WebSocket client connected');
    clients.add(ws);

    // Send welcome message and initial data
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Welcome to AgisFL WebSocket server'
    }));

    // Send initial dashboard data
    sendDashboardUpdate(ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'request_update':
            sendDashboardUpdate(ws);
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('📡 WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket client error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast updates to all connected clients every 5 seconds
  setInterval(() => {
    void broadcastDashboardUpdate(clients);
  }, 5000);

  wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error);
  });

  return wss;
}

async function generateDashboardData(): Promise<DashboardData> {
  return storage.getDashboardData();
}

async function sendDashboardUpdate(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    const data = await generateDashboardData();
    ws.send(JSON.stringify({
      type: 'dashboard_update',
      data
    }));
  }
}

async function broadcastDashboardUpdate(clients: Set<WebSocket>) {
  const data = await generateDashboardData();
  const message = JSON.stringify({
    type: 'dashboard_update',
    data
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    } else {
      clients.delete(client);
    }
  });
}