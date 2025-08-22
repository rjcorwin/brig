// Main agent client
export { BrigAgentClient, BrigAgentClient as MCPxAgentClient } from './BrigAgentClient';
export type { BrigAgentConfig } from './BrigAgentClient';

// Types
export * from './types';

// Keep backward compatibility
export { BrigAgentClient as default } from './BrigAgentClient';