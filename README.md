# RAG Support Chatbot

A customer support assistant that answers questions grounded in a company's own documentation, built with retrieval-augmented generation (RAG). Ask it about orders, shipping, returns, sizing, or warranty, and it answers using only the provided knowledge base — and honestly says when it doesn't know.

**Live demo:** https://rag-support-bot-tau.vercel.app/

## How it works

The app has two phases:

**Ingestion (offline, run once):** The source document is split into semantic chunks, each chunk is converted into an embedding vector via OpenAI, and the results are stored in `data/embeddings.json`.

**Query (runtime):** When a user asks a question, the question is embedded with the same model, compared against every chunk using cosine similarity, and the most relevant chunks are retrieved. Those chunks are injected into the prompt as context, and the LLM generates an answer grounded in that context. This prevents hallucination — the model answers from the knowledge base, not from its training data.

The full conversation history is sent on each request, so the assistant handles follow-up questions in context. Responses are streamed token by token for a responsive UX.

## Tech stack

- **Next.js (App Router)** — React frontend + serverless API routes
- **OpenAI API** — `text-embedding-3-small` for embeddings, `gpt-4o-mini` for generation
- **In-memory vector search** — cosine similarity in plain TypeScript (no external vector DB needed for this scale)

For production scale, the in-memory store would be replaced with a vector database like pgvector or Pinecone.

## Running locally

1. Clone the repo and install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Add your OpenAI API key to `.env.local`:
   \`\`\`
   OPENAI_API_KEY=sk-...
   \`\`\`
3. Generate the embeddings from the source document:
   \`\`\`bash
   npm run ingest
   \`\`\`
4. Start the dev server:
   \`\`\`bash
   npm run dev
   \`\`\`

Open http://localhost:3000.

## Project structure

- `data/docs.md` — the source knowledge base
- `scripts/ingest.ts` — chunks and embeds the document
- `lib/rag.ts` — embedding + cosine similarity retrieval
- `app/api/chat/route.ts` — retrieval + streaming LLM response
- `app/page.tsx` — chat UI