import { createRequire } from "node:module";
import { createTranscriptHandler } from "../lib/transcript-api.mjs";

const require = createRequire(import.meta.url);
const manifest = require("../data/lessons.json");

export default createTranscriptHandler({ lessons: manifest.lessons });