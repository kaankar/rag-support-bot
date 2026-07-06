import OpenAI from 'openai';
import { retrieve } from '@/lib/rag';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Basit bellek-içi IP rate limit ---
const WINDOW_MS = 60_000; // 1 dakikalık pencere
const MAX_REQUESTS = 10;  // pencere başına IP başına istek
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);
  return timestamps.length > MAX_REQUESTS;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

    if (isRateLimited(ip)) {
      return Response.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const { messages } = await req.json();

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      return Response.json({ error: 'No user message' }, { status: 400 });
    }

    const contextChunks = await retrieve(lastUser.content, 3);
    const context = contextChunks.join('\n\n---\n\n');

    const systemPrompt = `You are a helpful customer support assistant for Luna & Co., a fine jewelry store.
Answer the user's question using ONLY the information in the context below.
If the answer is not in the context, say you don't have that information and suggest contacting support.
Keep answers concise and friendly.

Context:
${context}`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 500,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('Chat error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}