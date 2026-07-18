import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export interface Tool<
  Schema extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
> {
  name: string;
  description: string;
  input: Schema;
  handler: (args: z.infer<Schema>) => Promise<unknown>;
  annotations: ToolAnnotations;
}

export function annotate(title: string, access: "read"): ToolAnnotations;
export function annotate(
  title: string,
  access: "write",
  opts?: { destructive?: boolean; idempotent?: boolean },
): ToolAnnotations;
export function annotate(
  title: string,
  access: "read" | "write",
  opts: {
    destructive?: boolean;
    idempotent?: boolean;
  } = {},
): ToolAnnotations {
  if (access === "read") {
    return {
      title,
      readOnlyHint: true,
      openWorldHint: true,
    };
  } else {
    return {
      title,
      readOnlyHint: false,
      destructiveHint: opts.destructive || false,
      idempotentHint: opts.idempotent || false,
      openWorldHint: true,
    };
  }
}

export function registerTool<Schema extends z.ZodObject<z.ZodRawShape>>(
  server: McpServer,
  tool: Tool<Schema>,
) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.input.shape,
      annotations: tool.annotations,
    },
    async (args) => {
      try {
        const response = await tool.handler(args);
        const data = JSON.stringify(response, null, 2);
        return {
          content: [{ type: "text", text: data }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: msg }],
        };
      }
    },
  );
}
