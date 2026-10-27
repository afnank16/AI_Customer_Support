import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8787;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a friendly, efficient customer support agent for
an app called Northwind. Keep answers short (2-4 sentences unless the person
asks for detail), be warm but not overly chatty, and if you don't know the
answer to something account-specific, say so and offer to connect the person
with a human agent rather than guessing.`;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(GROQ_API_KEY),
  });
});

const server = http.createServer(app);

const wss = new WebSocketServer({
  server,
  path: '/ws',
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  const history = [];

  ws.send(JSON.stringify({ type: 'connected' }));

  ws.on('message', async (raw) => {
    let payload;

    try {
      payload = JSON.parse(raw.toString());
    } catch {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Malformed message.',
        })
      );
      return;
    }

    if (payload.type !== 'user_message') return;

    const userText = payload.text?.trim();

    if (!userText) return;

    history.push({
      role: 'user',
      content: userText,
    });

    if (!GROQ_API_KEY) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message:
            'No GROQ_API_KEY found. Add it to backend/.env and restart.',
        })
      );
      return;
    }

    try {
      await streamAssistantReply(ws, history);
    } catch (err) {
      console.error('Groq API error:', err);

      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'The assistant is unavailable right now.',
        })
      );
    }
  });

    ws.on('close', () => {
    console.log('WebSocket client disconnected');
    history.length = 0;
  });
});

async function streamAssistantReply(ws, history) {
  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    ...history,
  ];

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        stream: true,
      }),
    }
  );

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');

    throw new Error(
      `Groq API responded ${response.status}: ${text}`
    );
  }

  ws.send(JSON.stringify({ type: 'assistant_start' }));

  let fullText = '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n');

    buffer = parts.pop();

    for (const line of parts) {
      if (!line.startsWith('data: ')) continue;

      const data = line.substring(6);

      if (data === '[DONE]') continue;

      let json;

      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }

      const token = json.choices?.[0]?.delta?.content;

      if (!token) continue;

      fullText += token;

      ws.send(
        JSON.stringify({
          type: 'assistant_chunk',
          text: token,
        })
      );
    }
  }

  history.push({
    role: 'assistant',
    content: fullText,
  });

  ws.send(
    JSON.stringify({
      type: 'assistant_done',
    })
  );
}

server.listen(PORT,'0.0.0.0', () => {
  console.log(`AI support chat backend listening on http://0.0.0.0:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://10.173.27.145:${PORT}`);
  console.log(`WebSocket: ws://10.173.27.145:${PORT}/ws`);

  if (!GROQ_API_KEY) {
    console.warn(
      '⚠️ GROQ_API_KEY is not set. Add it to backend/.env'
    );
  }
});