import { MCPxClient, MCPxConfig, Envelope } from '@mcpxp/sdk-typescript';
import Debug from 'debug';
import {
  Peer,
  Tool,
  ToolCall,
  ToolResult,
  ToolCallRequest,
  MCPRequest,
  MCPResponse,
  AgentEvents
} from './types';

const debug = Debug('brig:agent-client');

export interface BrigAgentConfig extends MCPxConfig {
  agentId?: string;
  agentName?: string;
  description?: string;
}

/**
 * Brig Agent Client - Extends MCPxClient with agent-specific functionality
 * Adds peer management, tool registration, and MCP protocol support
 */
export class BrigAgentClient extends MCPxClient {
  // Agent state
  private peers = new Map<string, Peer>();
  private localTools = new Map<string, Tool>();
  private toolHandlers = new Map<string, (params: any) => Promise<any>>();
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  }>();

  constructor(config: BrigAgentConfig) {
    // Use agentId as participantId if provided
    super({
      ...config,
      participantId: config.agentId || config.participantId,
      participantName: config.agentName || config.participantName
    });
    
    this.setupAgentHandlers();
  }

  private setupAgentHandlers(): void {
    // Handle presence events for peer tracking
    this.on('presence', (event: any) => {
      if (event.status === 'joined') {
        const peer: Peer = {
          id: event.participantId,
          name: event.participantName || event.participantId,
          status: 'active',
          capabilities: event.capabilities || []
        };
        this.peers.set(peer.id, peer);
        this.emit('peerJoined', peer);
      } else if (event.status === 'left') {
        const peer = this.peers.get(event.participantId);
        if (peer) {
          this.peers.delete(event.participantId);
          this.emit('peerLeft', peer);
        }
      }
    });

    // Handle tool discovery
    this.on('tools.list', (data: any) => {
      if (data.from && data.tools) {
        const peer = this.peers.get(data.from);
        if (peer) {
          peer.capabilities = data.tools;
          this.emit('peerUpdated', peer);
        }
      }
    });

    // Handle incoming tool calls
    this.on('mcp.request', async (request: MCPRequest) => {
      debug('Received MCP request:', request);
      await this.handleToolCall(request);
    });

    // Handle tool responses
    this.on('mcp.response', (response: MCPResponse) => {
      debug('Received MCP response:', response);
      const pending = this.pendingRequests.get(response.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(response.id);
        
        if (response.error) {
          pending.reject(new Error(response.error.message));
        } else {
          pending.resolve(response.result);
        }
      }
    });

    // Handle system welcome
    this.on('welcome', (data: any) => {
      debug('Received welcome:', data);
      // Announce our tools
      this.announceTools();
    });
  }

  // Tool Management
  registerTool(tool: Tool, handler: (params: any) => Promise<any>): void {
    this.localTools.set(tool.name, tool);
    this.toolHandlers.set(tool.name, handler);
    debug('Registered tool:', tool.name);
    
    // Announce the new tool if connected
    if (this.isConnected) {
      this.announceTools();
    }
  }

  private announceTools(): void {
    const tools = Array.from(this.localTools.values());
    this.send({
      type: 'tools.announce',
      tools
    });
  }

  private async handleToolCall(request: MCPRequest): Promise<void> {
    const { method, params, id } = request;
    const handler = this.toolHandlers.get(method);
    
    if (!handler) {
      this.send({
        type: 'mcp.response',
        id,
        error: {
          code: -32601,
          message: `Tool not found: ${method}`
        }
      }, request.from);
      return;
    }

    try {
      const result = await handler(params);
      this.send({
        type: 'mcp.response',
        id,
        result
      }, request.from);
    } catch (error: any) {
      this.send({
        type: 'mcp.response',
        id,
        error: {
          code: -32603,
          message: error.message
        }
      }, request.from);
    }
  }

  // Peer Tool Invocation
  async callPeerTool(
    peerId: string,
    tool: string,
    params: any,
    timeout = 30000
  ): Promise<any> {
    const requestId = this.generateMessageId();
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Tool call timeout: ${tool}`));
      }, timeout);
      
      this.pendingRequests.set(requestId, { resolve, reject, timer });
      
      this.send({
        type: 'mcp.request',
        id: requestId,
        method: tool,
        params
      }, peerId);
    });
  }

  // Peer Discovery
  async discoverPeers(): Promise<Peer[]> {
    this.send({
      type: 'presence.query'
    });
    
    // Wait a bit for responses
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Array.from(this.peers.values());
  }

  async discoverPeerTools(peerId: string): Promise<Tool[]> {
    const response = await this.callPeerTool(peerId, 'tools.list', {});
    return response.tools || [];
  }

  // Getters
  getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  getPeer(id: string): Peer | undefined {
    return this.peers.get(id);
  }

  getLocalTools(): Tool[] {
    return Array.from(this.localTools.values());
  }

  // Override to clean up on disconnect
  disconnect(): void {
    // Clear pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Disconnected'));
    }
    this.pendingRequests.clear();
    
    // Clear peers
    this.peers.clear();
    
    // Call parent disconnect
    super.disconnect();
  }
}

// Re-export the agent client as the primary export
export { BrigAgentClient as MCPxAgentClient };