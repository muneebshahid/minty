import fs from "node:fs";
import { z } from "zod";
import { MintyError } from "../../shared/errors.js";

export const mintyConfigSchema = z.object({
  defaultCurrency: z.string().optional(),
  categories: z.array(z.string()).optional(),
  llm: z
    .object({
      provider: z.enum(["openai", "anthropic", "ollama", "none"]),
      model: z.string().optional(),
      apiKeyEnv: z.string().optional(),
      enabled: z.boolean(),
    })
    .default({ provider: "none", enabled: false }),
  privacy: z
    .object({
      sendRawDescriptionToLLM: z.boolean().default(false),
      sendAmountsToLLM: z.boolean().default(true),
      sendDatesToLLM: z.boolean().default(true),
    })
    .default({
      sendRawDescriptionToLLM: false,
      sendAmountsToLLM: true,
      sendDatesToLLM: true,
    }),
});

export type MintyConfig = z.infer<typeof mintyConfigSchema>;

export function defaultMintyConfig(): MintyConfig {
  return mintyConfigSchema.parse({});
}

export function readConfigOrDefault(configPath: string): MintyConfig {
  if (!fs.existsSync(configPath)) return defaultMintyConfig();
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf8")) as unknown;
    return mintyConfigSchema.parse(raw);
  } catch (error) {
    throw new MintyError(`Failed to read config at ${configPath}`, {
      cause: error,
    });
  }
}

export function writeConfig(configPath: string, config: MintyConfig) {
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
