import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'node:fs';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function chunkBySection(text: string): string[] {
  return text
    .split(/\n(?=## )/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const raw = fs.readFileSync('data/docs.md', 'utf-8');
  const chunks = chunkBySection(raw);
  console.log(`${chunks.length} parça oluşturuldu. Embedding alınıyor...`);

  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks,
  });

  const embedded = chunks.map((text, i) => ({
    text,
    embedding: res.data[i].embedding,
  }));

  fs.writeFileSync('data/embeddings.json', JSON.stringify(embedded, null, 2));
  console.log(
    `Bitti → data/embeddings.json (${embedded.length} parça, her biri ${embedded[0].embedding.length} boyut)`
  );
}

main().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});