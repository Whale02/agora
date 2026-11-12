// Single point of truth for models, paths, and site constants.
// Bumped whenever prompt assembly, the seating rule, or retrieval changes in a way that
// would make a new conversation incomparable with an old one.
export const ENGINE_VERSION = "2026.09-retrieval";

export const MODELS = {
  heartbeat: "claude-opus-4-6",  // agent-to-agent: the conversations are the product
  dialogue: "claude-opus-4-6",   // user-facing replies
};

export const SITE = {
  url: "https://whale02.github.io/agora",
  repo: "Whale02/agora",
  title: "Agora",
};

export const PATHS = {
  data: "docs/data",
  philosophers: "docs/data/philosophers.json",
  topics: "docs/data/topics.json",
  conversations: "docs/data/conversations",
  index: "docs/data/index.json",
  stubs: "docs/c",
};

// Message counts scale down as tables get bigger, staying in the 6-8 range.
export const ROUNDS_BY_SIZE = { 2: 3, 3: 2, 4: 2 };
