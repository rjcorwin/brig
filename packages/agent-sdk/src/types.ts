import { z } from 'zod';

// Re-export base types from SDK
export type { Envelope, MCPxEvents } from '@mcpxp/sdk-typescript';

// Agent-specific types

// Peer types
export interface Peer {
  id: string;
  name?: string;
  status: 'active' | 'idle' | 'offline';
  capabilities: Tool[];
  metadata?: Record<string, any>;
}

// Tool types  
export interface Tool {
  name: string;
  description?: string;
  inputSchema?: any;
}

// Tool call types
export interface ToolCall {
  peerId: string;
  tool: string;
  params: any;
  timeout?: number;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

// Tool call protocol
export interface ToolCallRequest {
  id: string;
  from: string;
  method: string;
  params: any;
}

// MCP Protocol types
export interface MCPRequest {
  id: string;
  from: string;
  method: string;
  params: any;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Agent-specific events
export interface AgentEvents {
  peerJoined: (peer: Peer) => void;
  peerLeft: (peer: Peer) => void;
  peerUpdated: (peer: Peer) => void;
  toolCall: (request: ToolCallRequest) => void;
  toolResult: (result: ToolResult) => void;
}