import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const DIST_DIR = path.join(import.meta.dirname, "dist");

const MODEL_VERSION =
  "tattzy25/tattty_4_all:4e8f6c1dc77db77dabaf98318cde3679375a399b434ae2db0e698804ac84919c";
const TRIGGER_WORD = "TA-TTT-OO-ME";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Tattty 4 All - Tattoo Generator",
    version: "1.0.0",
  });

  const resourceUri = "ui://tattty/mcp-app.html";

  // ─── Tool: generate_tattoo ────────────────────────────────────────────────
  registerAppTool(
    server,
    "generate_tattoo",
    {
      title: "Generate Tattoo Design",
      description:
        "Generate a custom tattoo design using the tattty_4_all LoRA model trained on 678 sketch designs. Returns an interactive UI for exploring prompts and viewing a gallery of past generations.",
      inputSchema: {
        prompt: z
          .string()
          .optional()
          .describe(
            `Tattoo description. The trigger word ${TRIGGER_WORD} will be added automatically.`
          ),
        aspect_ratio: z
          .enum(["1:1", "16:9", "9:16", "4:3", "3:4"])
          .optional()
          .default("1:1")
          .describe("Aspect ratio of the generated image"),
      },
      _meta: { ui: { resourceUri } },
    },
    async ({ prompt, aspect_ratio }) => {
      const apiToken = process.env.REPLICATE_API_TOKEN;

      const fullPrompt = prompt
        ? `${TRIGGER_WORD} ${prompt}`
        : `${TRIGGER_WORD} a bold blackwork tattoo design with intricate details`;

      // Start the prediction
      const createRes = await fetch(
        "https://api.replicate.com/v1/predictions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
            Prefer: "wait",
          },
          body: JSON.stringify({
            version: MODEL_VERSION,
            input: {
              prompt: fullPrompt,
              aspect_ratio: aspect_ratio ?? "1:1",
              model: "dev",
            },
          }),
        }
      );

      const prediction = (await createRes.json()) as {
        id: string;
        status: string;
        output?: string[];
        error?: string;
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: prediction.status,
              imageUrl: prediction.output?.[0] ?? null,
              prompt: fullPrompt,
              aspect_ratio: aspect_ratio ?? "1:1",
              predictionId: prediction.id,
            }),
          },
        ],
      };
    }
  );

  // ─── Resource: the bundled UI HTML ────────────────────────────────────────
  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "mcp-app.html"),
        "utf-8"
      );
      return {
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    }
  );

  return server;
}
