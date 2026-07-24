import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

let _client;

/** Lazily create the shared AIProjectClient so a missing env var surfaces as
 *  a catchable error in API routes instead of crashing the module import. */
export function getFoundryProject() {
  if (!_client) {
    const endpoint = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;
    if (!endpoint) {
      throw new Error(
        "AZURE_FOUNDRY_PROJECT_ENDPOINT is missing from .env.local"
      );
    }
    _client = new AIProjectClient(endpoint, new DefaultAzureCredential());
  }
  return _client;
}
