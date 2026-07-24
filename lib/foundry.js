import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

const endpoint = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;

if (!endpoint) {
  throw new Error(
    "AZURE_FOUNDRY_PROJECT_ENDPOINT is missing from .env.local"
  );
}

export const foundryProject = new AIProjectClient(
  endpoint,
  new DefaultAzureCredential()
);
