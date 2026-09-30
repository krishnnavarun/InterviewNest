// Tiny vector helpers for retrieval over a single user's interview history.
// A user has at most a few hundred chunks, so exact search in Node is fast and
// avoids running a vector database.

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

/** Top-k items by similarity to `query`, dropping anything below `minScore`. */
export function topK(query, items, k = 6, minScore = 0.3) {
  return items
    .map((item) => ({ item, score: cosineSimilarity(query, item.embedding) }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
