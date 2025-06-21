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
  // Send initial state
  ws.send(JSON.stringify({ type: 'init', candidates }));

  // Handle incoming messages
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'add') {
      candidates.push(data.payload);
      broadcast({ type: 'add', payload: data.payload });
    }

    if (data.type === 'delete') {
      candidates = candidates.filter((c) => c.id !== data.payload.id);
      broadcast({ type: 'delete', payload: data.payload });
    }

    if (data.type === 'update') {
      candidates = candidates.map((c) =>
        c.id === data.payload.id ? data.payload : c
      );
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

server.listen(3001, () => {
  console.log('WebSocket/REST server running on http://localhost:3001');
});
