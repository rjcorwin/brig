# Brig: MCPx Agent Orchestration Platform

Brig (short for Brigantine) is a comprehensive orchestration platform for MCPx-based multi-agent systems. Like Docker Desktop for containers, Brig provides both core orchestration capabilities and optional UI tooling for managing multi-agent workflows.

## Repository Structure

```
brig/
├── packages/       # Core packages
│   ├── brig-cli/     # CLI and orchestration engine
│   ├── brig-studio/  # Desktop management app
│   └── agent-sdk/    # Agent development SDK
├── agents/         # Example agents
└── examples/       # Configuration examples
```

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start the system
npx brig up

# Open Brig Studio
npm run dev:studio
```

## Key Commands

```bash
brig up              # Start the MCPx system
brig down            # Stop everything
brig agent create    # Create a new agent
brig agent list      # List all agents
brig status          # System status
```

## Packages

- **@mcpxp/brig-cli** - Command-line interface and orchestration engine
- **@mcpxp/brig-studio** - Electron-based desktop application for visual management
- **@mcpxp/brig-agent-sdk** - SDK for building MCPx-native agents

## Architecture

Brig manages:
- MCPx gateway server
- Multiple agent instances
- MCP server bridges
- Web interfaces
- Process lifecycle

## Documentation

See [docs/](docs/) for detailed documentation.

## License

MIT