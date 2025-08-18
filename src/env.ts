// src/env.ts
import { z } from "zod";

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

// Describe what your app expects:
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  TOKENIZATION_API_URL: z.string().url().optional(),
  TOKENIZATION_API_USERNAME: z.string().optional(),
  TOKENIZATION_API_PASSWORD: z.string().optional(),
  IPFS_GATEWAY: z.string().url().optional(),
  IOT_STORAGE_SENSORS_API_URL: z.string().url().optional(),
  BLOCKFROST_API_KEY: z.string().optional(),
});

// Read from process.env & validate:
const envVars = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  TOKENIZATION_API_URL:
    process.env.NEXT_PUBLIC_TOKENIZATION_API_URL ||
    process.env.TOKENIZATION_API_URL,
  TOKENIZATION_API_USERNAME:
    process.env.NEXT_PUBLIC_TOKENIZATION_API_USERNAME ||
    process.env.TOKENIZATION_API_USERNAME,
  TOKENIZATION_API_PASSWORD:
    process.env.NEXT_PUBLIC_TOKENIZATION_API_PASSWORD ||
    process.env.TOKENIZATION_API_PASSWORD,
  IPFS_GATEWAY:
    process.env.NEXT_PUBLIC_IPFS_GATEWAY || process.env.IPFS_GATEWAY,
  IOT_STORAGE_SENSORS_API_URL:
    process.env.NEXT_PUBLIC_IOT_STORAGE_SENSORS_API_URL ||
    process.env.IOT_STORAGE_SENSORS_API_URL,
  BLOCKFROST_API_KEY:
    process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY ||
    process.env.BLOCKFROST_API_KEY,
};

export const env = EnvSchema.parse(envVars);

// Helper function to check if required environment variables are set
export const checkRequiredEnvVars = () => {
  // If we're not in the browser, return true to avoid SSR issues
  if (!isBrowser) {
    return true;
  }

  // In development mode, be more lenient
  if (env.NODE_ENV === "development") {
    console.log("Development mode: Environment variable checking is lenient");
    return true;
  }

  // Only check essential variables for production
  const essential = [
    "TOKENIZATION_API_URL",
    "TOKENIZATION_API_USERNAME",
    "TOKENIZATION_API_PASSWORD",
    "IPFS_GATEWAY",
  ];

  const missing = essential.filter((key) => !env[key as keyof typeof env]);

  if (missing.length > 0) {
    console.warn("Missing essential environment variables:", missing);
    console.warn("Please check your .env.local file");
    return false;
  }

  return true;
};
