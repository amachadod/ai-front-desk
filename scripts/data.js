// Loads the sample data and the kit for the demo, the command line and the tests.
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
export const sample = () => ({
  requests: JSON.parse(read("examples/requests.json")).requests,
  usage: JSON.parse(read("examples/usage.json")),
  promptsMd: read("kit/prompt-library.md"),
});
