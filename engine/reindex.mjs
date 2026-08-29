// Rebuild docs/data/index.json and the OG share stubs from the conversation files.
import { rebuildIndex } from "./lib.mjs";
rebuildIndex();
console.log("index and share stubs rebuilt");
