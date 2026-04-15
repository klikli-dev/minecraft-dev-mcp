#!/usr/bin/env node

/**
 * Minecraft Dev CLI
 * Command-line interface for invoking MCP tools directly without MCP protocol.
 * Designed for use in scripts, skills, and automation.
 */

import { verifyJavaVersion } from './java/java-process.js';
import { handleToolCall, tools } from './server/tools.js';
import { logger } from './utils/logger.js';

// CLI output helper - always outputs to stdout, never breaks structured output
function output(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function outputError(message: string): void {
  console.error(JSON.stringify({ error: message }, null, 2));
  process.exit(1);
}

// Print help text
function printHelp(): void {
  const helpText = `
Minecraft Dev CLI - Command-line interface for Minecraft mod development tools

USAGE:
  minecraft-dev-cli <command> [arguments]

COMMANDS:
  list-tools           List all available tools with their parameters
  help                 Show this help message
  <tool-name>          Invoke a tool with JSON arguments

EXAMPLES:
  # List all available tools
  minecraft-dev-cli list-tools

  # Get Minecraft source for a class
  minecraft-dev-cli get_minecraft_source '{"version": "1.21.10", "className": "net.minecraft.world.entity.Entity", "mapping": "yarn"}'

  # List available Minecraft versions
  minecraft-dev-cli list_minecraft_versions '{}'

  # Analyze a mod JAR
  minecraft-dev-cli analyze_mod_jar '{"jarPath": "/path/to/mod.jar"}'

  # Search Minecraft code
  minecraft-dev-cli search_minecraft_code '{"version": "1.21.10", "query": "Entity", "searchType": "class", "mapping": "yarn"}'

AVAILABLE TOOLS:
${tools.map(t => `  ${t.name.padEnd(35)} ${t.description.split('.')[0]}`).join('\n')}

For more details on a tool, run: minecraft-dev-cli list-tools

ENVIRONMENT VARIABLES:
  CACHE_DIR   Override the default cache directory location
  LOG_LEVEL   Logging verbosity: DEBUG, INFO, WARN, ERROR

SKILL INTEGRATION:
  This CLI is designed to be called from skills and scripts:
  - Output is always valid JSON
  - Exit code 0 for success, 1 for error
  - Results are in the "content" field of MCP-style response
`.trim();

  console.log(helpText);
}

// List all tools with their schemas
function listTools(): void {
  const toolList = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.inputSchema,
  }));

  output({
    tools: toolList,
    total: tools.length,
  });
}

// Parse arguments - handles both formats:
// 1. tool-name '{"key": "value"}' (JSON as second arg)
// 2. tool-name --key value --key2 value2 (flag format)
function parseArgs(args: string[]): { tool: string; params: Record<string, unknown> } {
  if (args.length === 0) {
    outputError('No command specified. Run "minecraft-dev-cli help" for usage.');
  }

  const command = args[0];

  // Check for help flag
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  // Handle list-tools command
  if (command === 'list-tools') {
    listTools();
    process.exit(0);
  }

  // Find the tool
  const tool = tools.find(t => t.name === command);
  if (!tool) {
    outputError(`Unknown tool: ${command}\nRun "minecraft-dev-cli list-tools" to see available tools.`);
  }

  // Parse parameters
  let params: Record<string, unknown> = {};

  if (args.length > 1) {
    // Check if second arg is JSON
    if (args[1].startsWith('{')) {
      try {
        params = JSON.parse(args.slice(1).join(' '));
      } catch {
        outputError('Invalid JSON arguments. Ensure the JSON is properly formatted.');
      }
    } else {
      // Parse flag format: --key value --key2 value2
      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
          const key = arg.slice(2);
          const nextArg = args[i + 1];
          if (nextArg && !nextArg.startsWith('--')) {
            // Try to parse as JSON value
            try {
              params[key] = JSON.parse(nextArg);
            } catch {
              params[key] = nextArg;
            }
            i++;
          } else {
            params[key] = true;
          }
        } else {
          outputError(`Unexpected argument: ${arg}\nUse --key value format or pass JSON.`);
        }
      }
    }
  }

  return { tool: tool?.name ?? 'unknown', params };
}

// Invoke a tool and format output
async function invokeTool(toolName: string, params: Record<string, unknown>): Promise<void> {
  try {
    logger.info(`Invoking tool: ${toolName} with params: ${JSON.stringify(params)}`);

    const result = await handleToolCall(toolName, params);

    // Format the result for CLI output
    if (result.isError) {
      // Extract error message from content
      const errorText = result.content?.[0]?.type === 'text'
        ? result.content[0].text
        : 'Unknown error';

      output({
        success: false,
        error: errorText,
        tool: toolName,
      });
      process.exit(1);
    }

    // Parse the text content if it's JSON
    let parsedResult: unknown = result;
    if (result.content?.[0]?.type === 'text') {
      try {
        parsedResult = JSON.parse(result.content[0].text);
      } catch {
        // Not JSON, use as-is
        parsedResult = result.content[0].text;
      }
    }

    output({
      success: true,
      tool: toolName,
      result: parsedResult,
    });
  } catch (error) {
    logger.error(`Tool invocation failed: ${toolName}`, error);
    output({
      success: false,
      tool: toolName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Main entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Show help if no args
  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // Verify Java is installed (required for most tools)
  try {
    await verifyJavaVersion(17);
  } catch (error) {
    outputError(`Java 17+ is required but not found: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Parse and execute
  const { tool, params } = parseArgs(args);
  await invokeTool(tool, params);
}

// Run
main().catch((error) => {
  outputError(`CLI failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
});
