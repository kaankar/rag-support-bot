import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Chunk = { text: string; embedding: number[] };

let chunks: Chunk[] | null = null;
function loadChunks(): Chunk[] {
  if (chunks) return chunks;
  const file = path.join(process.cwd(), 'data', 'embeddings.json');
  chunks = JSON.parse(fs.readFileSync(file, 'utf-8'));
  return chunks!;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

export async function retrieve(query: string, topK = 3): Promise<string[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryEmbedding = res.data[0].embedding;

  const scored = loadChunks().map((c) => ({
    text: c.text,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.text);
}