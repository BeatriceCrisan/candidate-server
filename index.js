const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

let candidates = [];

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  ws.send(JSON.stringify({ type: 'init', candidates }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'add') {
      candidates.push(data.payload);
      broadcast({ type: 'add', payload: data.payload });
    }

    if (data.type === 'delete') {
      candidates = candidates.filter(c => c.id !== data.payload);
      broadcast({ type: 'delete', payload: { id: data.payload } });
    }

    if (data.type === 'update') {
      candidates = candidates.map(c => (c.id === data.payload.id ? data.payload : c));
      broadcast({ type: 'update', payload: data.payload });
    }
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

app.get('/', (_, res) => res.send('Backend running...'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ WebSocket/REST server running on http://localhost:${PORT}`);
});
