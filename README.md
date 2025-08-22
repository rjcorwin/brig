# Drift: MCPx Agent Orchestration Platform

Drift is a comprehensive orchestration platform for MCPx-based multi-agent systems. Like Docker Desktop for containers, Drift provides both core orchestration capabilities and optional UI tooling for managing multi-agent workflows.

## Repository Structure

```
drift/
├── packages/       # Core packages
│   ├── drift-cli/    # CLI and orchestration engine
│   ├── drift-studio/ # Desktop management app
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
npx drift up

# Open Drift Studio
npm run dev:studio
```

## Key Commands

```bash
drift up              # Start the MCPx system
drift down            # Stop everything
drift agent create    # Create a new agent
drift agent list      # List all agents
drift status          # System status
```

## Packages

- **drift-cli** - Command-line interface and orchestration engine
- **drift-studio** - Electron-based desktop application for visual management
- **@drift/agent-sdk** - SDK for building MCPx-native agents

## Architecture

Drift manages:
- MCPx gateway server
- Multiple agent instances
- MCP server bridges
- Web interfaces
- Process lifecycle

## Documentation

See [docs/](docs/) for detailed documentation.

## License

MIT