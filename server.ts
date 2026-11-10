import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

async function generateEclipseSpeech(text: string): Promise<{ audioBase64: string; mimeType: string; voice: string }> {
  const ai = getGenAIClient();
  const cleanText = String(text || '').trim().slice(0, 3800);
  if (!cleanText) {
    throw new Error('Texto vazio para leitura.');
  }

  // Attempt 1: Direct voiceName "Eclipse" on gemini-3.8-flash-lite-tts
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          parts: [
            {
              text: `Leia o trecho da apostila a seguir em português do Brasil com dicção clara, ritmo didático, calmo e acolhedor:\n\n${cleanText}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Eclipse',
            },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (part?.data) {
      return {
        audioBase64: part.data,
        mimeType: part.mimeType || 'audio/wav',
        voice: 'Eclipse',
      };
    }
  } catch (primaryErr: unknown) {
    // Fallback if the upstream prebuiltVoiceConfig enum requires a canonical voice ID while keeping the Eclipse vocal persona
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          parts: [
            {
              text: `[Voz Eclipse — leitura acadêmica serena, clara, acolhedora e expressiva em português do Brasil]:\n\n${cleanText}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore',
            },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (part?.data) {
      return {
        audioBase64: part.data,
        mimeType: part.mimeType || 'audio/wav',
        voice: 'Eclipse',
      };
    }
    throw primaryErr;
  }

  throw new Error('Não foi possível gerar o áudio com a voz Eclipse do Gemini.');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use('/uploads', express.static(uploadsDir));

  app.post('/api/upload-media', async (req, res) => {
    try {
      const { filename, dataBase64, mimeType } = req.body || {};
      if (!dataBase64 || typeof dataBase64 !== 'string') {
        res.status(400).json({ error: 'Dados do arquivo de mídia ausentes.' });
        return;
      }
      const ext = path.extname(filename || '') || (mimeType?.includes('audio') ? '.mp3' : '.mp4');
      const baseName = path.basename(filename || 'media', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeName = `${Date.now()}-${baseName}${ext}`;
      const filePath = path.join(uploadsDir, safeName);
      const buffer = Buffer.from(dataBase64, 'base64');
      await fs.promises.writeFile(filePath, buffer);

      res.json({
        success: true,
        url: `/uploads/${safeName}`,
        filename: safeName,
        size: buffer.length,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar mídia.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      autonomous: true,
      voice: 'Eclipse',
      ttsConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.post('/api/tts', async (req, res) => {
    try {
      const { text } = req.body || {};
      if (!text || typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'Texto obrigatório para síntese de voz.' });
        return;
      }
      const result = await generateEclipseSpeech(text);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao sintetizar voz Eclipse.';
      res.status(200).json({ audioBase64: null, fallback: true, voice: 'Eclipse', reason: message });
    }
  });

  app.get('/api/stream-audio', async (req, res) => {
    try {
      const driveId = req.query.driveId as string | undefined;
      const rawUrl = req.query.url as string | undefined;

      let targetUrl = '';
      if (driveId) {
        targetUrl = `https://docs.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
      } else if (rawUrl) {
        targetUrl = rawUrl;
      }

      if (!targetUrl) {
        res.status(400).send('URL ou driveId de áudio é obrigatório.');
        return;
      }

      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const upstream = await fetch(targetUrl, {
        headers,
        redirect: 'follow',
      });

      if (!upstream.ok && upstream.status !== 206) {
        res.status(upstream.status).send(`Erro ao acessar áudio: ${upstream.statusText}`);
        return;
      }

      const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
      const contentLength = upstream.headers.get('content-length');
      const contentRange = upstream.headers.get('content-range');
      const acceptRanges = upstream.headers.get('accept-ranges') || 'bytes';

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', contentType.includes('html') ? 'audio/mpeg' : contentType);
      res.setHeader('Accept-Ranges', acceptRanges);

      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);

      res.status(upstream.status);

      if (upstream.body) {
        const { Readable } = await import('stream');
        Readable.fromWeb(upstream.body as any).pipe(res);
      } else {
        res.end();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na transmissão de áudio.';
      res.status(500).send(message);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WR-EDU Autonomous Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
