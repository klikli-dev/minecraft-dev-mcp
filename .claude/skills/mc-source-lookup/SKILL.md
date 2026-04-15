---
name: mc-source-lookup
description: Quickly look up Minecraft source code and class information using the CLI. Use when asked to find, show, or look up Minecraft classes, methods, or source code. Requires the minecraft-dev-cli binary to be available.
---

# Minecraft Source Lookup

Quickly retrieve Minecraft source code and class information using the CLI.

## Workflow

1. Identify the request type (source, search, versions, registry)
2. Build the CLI command with appropriate arguments
3. Execute and parse the JSON output
4. Return the formatted result

## Request Types

### Get Source Code for a Class

Use when user asks for a specific Minecraft class source.

```bash
minecraft-dev-cli get_minecraft_source '{"version": "<version>", "className": "<fully.qualified.ClassName>", "mapping": "yarn"}'
```

Parameters:
- `version`: Minecraft version (e.g., "1.21.10", "1.20.1")
- `className`: Fully qualified class name (e.g., "net.minecraft.world.entity.Entity")
- `mapping`: "yarn" or "mojmap" (default: yarn)
- `startLine`: Optional line to start from (1-indexed)
- `endLine`: Optional line to end at
- `maxLines`: Optional max lines to return

### List Available Minecraft Versions

Use to show what versions are available.

```bash
minecraft-dev-cli list_minecraft_versions '{}'
```

### Search Minecraft Code

Use when searching for classes, methods, or content.

```bash
minecraft-dev-cli search_minecraft_code '{"version": "<version>", "query": "<pattern>", "searchType": "class", "mapping": "yarn"}'
```

Parameters:
- `version`: Minecraft version
- `query`: Search pattern (regex supported)
- `searchType`: "class", "method", "field", "content", or "all"
- `mapping`: "yarn" or "mojmap"
- `limit`: Max results (default: 50)

### Get Registry Data

Use to get block, item, entity, or other registry data.

```bash
minecraft-dev-cli get_registry_data '{"version": "<version>", "registry": "block"}'
```

Parameters:
- `version`: Minecraft version
- `registry`: "block", "item", "entity", etc. (omit for all)

### Find Mapping Translation

Use to translate between mapping systems.

```bash
minecraft-dev-cli find_mapping '{"symbol": "<name>", "version": "<version>", "sourceMapping": "official", "targetMapping": "yarn"}'
```

### Build Search Index (for fast searching)

Before using indexed search, build the index:

```bash
minecraft-dev-cli index_minecraft_version '{"version": "<version>", "mapping": "yarn"}'
```

### Fast Search with Index

After building index:

```bash
minecraft-dev-cli search_indexed '{"query": "<fts5-query>", "version": "<version>", "mapping": "yarn"}'
```

Supports FTS5 syntax: AND, OR, NOT, "phrase", prefix*

## Common Patterns

### First-time Source Access

1. Check available versions: `list_minecraft_versions`
2. Get the class: `get_minecraft_source`

### Find a Class by Pattern

1. Search: `search_minecraft_code` with `searchType: "class"`
2. Get specific class: `get_minecraft_source`

### Fast Full-text Search

1. Build index (one-time): `index_minecraft_version`
2. Search: `search_indexed`

## Output Format

All CLI commands return JSON:

```json
{
  "success": true,
  "tool": "tool_name",
  "result": { ... }
}
```

On error:

```json
{
  "success": false,
  "tool": "tool_name",
  "error": "Error message"
}
```

## CLI Installation

Ensure `minecraft-dev-cli` is in PATH:

```bash
npm install -g @mcdxai/minecraft-dev-mcp
# OR from source:
npm run build
npm link
```

## Examples

### Get Entity class source
```bash
minecraft-dev-cli get_minecraft_source '{"version": "1.21.10", "className": "net.minecraft.world.entity.Entity", "mapping": "yarn"}'
```

### Search for Block-related classes
```bash
minecraft-dev-cli search_minecraft_code '{"version": "1.21.10", "query": "Block", "searchType": "class", "mapping": "yarn", "limit": 20}'
```

### Get all blocks from a version
```bash
minecraft-dev-cli get_registry_data '{"version": "1.21.10", "registry": "block"}'
```

### Find obfuscated name mapping
```bash
minecraft-dev-cli find_mapping '{"symbol": "a", "version": "1.21.10", "sourceMapping": "official", "targetMapping": "yarn"}'
```
