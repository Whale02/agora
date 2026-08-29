// Single point of truth for models, paths, and site constants.
export const MODELS = {
  heartbeat: "claude-haiku-4-5", // agent-to-agent exchanges: cheap, fast
  dialogue: "claude-sonnet-5",   // user-facing replies: higher quality
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
