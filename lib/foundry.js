import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential, ClientSecretCredential } from "@azure/identity";

let _client;

export function getFoundryProject() {
  if (!_client) {
    const endpoint = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;
    if (!endpoint) {
      throw new Error("AZURE_FOUNDRY_PROJECT_ENDPOINT is missing from environment");
    }

    const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;
    const credential =
      AZURE_TENANT_ID && AZURE_CLIENT_ID && AZURE_CLIENT_SECRET
        ? new ClientSecretCredential(AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
        : new DefaultAzureCredential();

    _client = new AIProjectClient(endpoint, credential);
  }
  return _client;
}
