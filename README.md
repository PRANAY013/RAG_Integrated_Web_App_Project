# High-Precision Hybrid RAG & Query-Routing Microservice

A state-of-the-art Retrieval-Augmented Generation (RAG) platform and Smart Chat-Bot built with Python, FastAPI, and LlamaIndex. 

This project goes beyond standard "toy" RAG implementations by solving core production issues: Score-Scale Incompatibility, Context Hallucinations, Generative Latency, and Token Over-consumption.

## 🚀 Key Architectural Highlights

*   **Custom Reciprocal Rank Fusion (RRF):** Fuses Dense Vector Search (`bge-large`) and Sparse Keyword Retrieval (`rank_bm25`) by mathematically merging incompatible score spaces without relying on arbitrary score normalization.
*   **CrossEncoder Re-Ranking:** Implements a custom two-stage retrieval pipeline. The `ms-marco-MiniLM` CrossEncoder jointly scores query-passage pairs to surface only the most contextually relevant chunks prior to LLM synthesis.
*   **Deterministic Intent Routing:** A strict 13-class heuristic intent router evaluates queries before embedding. Static intents (e.g., greetings, help) instantly bypass the generative LLM pipeline, guaranteeing zero latency and strictly limiting hallucinations.
*   **Cosine-Similarity Semantic Caching:** Dynamically caches LLM responses against query embeddings. Similar questions (e.g., "What is the return policy?" vs "How do I return an item?") hit the cache at an `0.85` similarity threshold, entirely bypassing the LLM.

## 📊 Live System Metrics

| Optimization | Cache Miss (Standard LLM) | Cache Hit (Semantic Bypass) | Impact |
| :--- | :--- | :--- | :--- |
| **Time-To-First-Token (TTFT)** | ~3.55 seconds | **~0.06 seconds** | **98.3% Latency Reduction** |
| **Token Cost / Inference Time** | Full generation cost | **0 tokens** (Zero LLM inference) | **100% Savings** |

## 🛠️ Technology Stack
*   **Core Frameworks:** Python, FastAPI, LlamaIndex
*   **Models:** `GroqAPI (LLaMA-4 / 3.1)` for generation, `BAAI/bge-large` for embeddings, `ms-marco-MiniLM` for CrossEncoding
*   **Search Algorithms:** BM25 (Sparse), Cosine Similarity (Dense)

## 📦 Building & Running

```bash
# Start the RAG backend service
make run-rag
```

## 📡 Core RAG Pipeline Flow
1. **Query Ingestion:** User intent is routed (13-classes). Non-RAG intents bypass the ML pipeline.
2. **Semantic Cache Check:** Query is embedded. If Cosine Similarity to a past query is > 0.85, return the cached response.
3. **Hybrid Retrieval:** Dense & Sparse search execute in parallel.
4. **RRF Fusion:** Lists are mathematically fused into a top-10 candidate list based purely on rank.
5. **CrossEncoder:** Top-10 candidates are jointly scored; Top-3 are selected.
6. **LLM Synthesis:** The Groq API (LLaMA) strictly grounds its response in the top-3 chunks.
