import * as fs from 'fs-extra';
import * as path from 'path';
import { IslandConfig, IslandState, IslandEvent } from '../types';
import { MCPxClient } from '@mcpxp/sdk-typescript';
import chalk from 'chalk';
import { EventEmitter } from 'events';

export class Island extends EventEmitter {
  private config: IslandConfig;
  private seaPath: string;
  private spirit?: IslandSpirit;
  
  constructor(seaPath: string, config: IslandConfig) {
    super();
    this.seaPath = seaPath;
    this.config = config;
  }
  
  static async create(seaPath: string, name: string, options: any = {}): Promise<Island> {
    const config: IslandConfig = {
      name,
      description: options.description || `The island of ${name}`,
      resources: options.resources ? options.resources.split(',') : [],
      climate: options.climate || 'tropical',
      events: options.events ? this.parseEvents(options.events) : [],
      created: new Date().toISOString(),
      state: {
        weather: 'calm',
        inhabitants: 0,
        lastActivity: new Date().toISOString(),
        treasures: 0,
        storms: 0
      }
    };
    
    const island = new Island(seaPath, config);
    await island.save();
    
    // Create and start the island spirit
    await island.awakenSpirit();
    
    return island;
  }
  
  private static parseEvents(eventsStr: string): IslandEvent[] {
    // Parse comma-separated event definitions
    const events: IslandEvent[] = [];
    const eventDefs = eventsStr.split(',');
    
    for (const def of eventDefs) {
      if (def.includes('tide')) {
        events.push({
          type: 'tide',
          schedule: '0 */6 * * *', // Every 6 hours
          action: 'cleanup_messages'
        });
      } else if (def.includes('storm')) {
        events.push({
          type: 'storm',
          trigger: 'error_rate > 0.1',
          action: 'alert_inhabitants'
        });
      }
    }
    
    return events;
  }
  
  async save(): Promise<void> {
    const islandDir = path.join(this.seaPath, '.brig', 'islands', this.config.name);
    await fs.ensureDir(islandDir);
    await fs.writeJson(path.join(islandDir, 'config.json'), this.config, { spaces: 2 });
  }
  
  static async load(seaPath: string, name: string): Promise<Island> {
    const configPath = path.join(seaPath, '.brig', 'islands', name, 'config.json');
    if (!await fs.pathExists(configPath)) {
      throw new Error(`Island '${name}' not found`);
    }
    
    const config = await fs.readJson(configPath);
    return new Island(seaPath, config);
  }
  
  async awakenSpirit(harbor?: string): Promise<void> {
    if (!harbor) {
      // Try to get harbor from sea config
      const brigConfig = path.join(this.seaPath, 'brig.yaml');
      if (await fs.pathExists(brigConfig)) {
        const content = await fs.readFile(brigConfig, 'utf-8');
        const match = content.match(/harbor:\s*(.+)/);
        if (match) {
          harbor = match[1].trim();
        }
      }
    }
    
    if (harbor && harbor !== 'not-set') {
      this.spirit = new IslandSpirit(this.config, harbor);
      await this.spirit.connect();
      
      console.log(chalk.green('🏝️  Island'), chalk.cyan(`'${this.config.name}'`), chalk.green('established!'));
      console.log(chalk.blue('🌴 The island spirit awakens and greets you:'));
      console.log(chalk.gray(`   "${this.config.description}"`));
      if (this.config.resources.length > 0) {
        console.log(chalk.gray(`   "I have access to: ${this.config.resources.join(', ')}"`));
      }
    }
  }
  
  async updateState(updates: Partial<IslandState>): Promise<void> {
    this.config.state = { ...this.config.state, ...updates };
    this.config.state.lastActivity = new Date().toISOString();
    await this.save();
  }
  
  getName(): string {
    return this.config.name;
  }
  
  getConfig(): IslandConfig {
    return this.config;
  }
  
  getDescription(): string {
    return this.config.description;
  }
  
  getResources(): string[] {
    return this.config.resources;
  }
  
  getWeather(): string {
    const weather = this.config.state.weather;
    const icons: Record<string, string> = {
      'calm': '☀️',
      'partly-cloudy': '⛅',
      'stormy': '⛈️',
      'foggy': '🌫️'
    };
    return `${icons[weather] || '🌤️'} ${weather}`;
  }
  
  async triggerEvent(eventType: string): Promise<void> {
    console.log(chalk.yellow(`🏝️  ${this.config.name}:`), this.getEventMessage(eventType));
    
    switch (eventType) {
      case 'tide':
        console.log(chalk.blue('🌊 TIDE EVENT: Cleaning up old messages...'));
        this.emit('tide');
        break;
      case 'storm':
        console.log(chalk.red('⛈️  STORM EVENT: High activity detected!'));
        this.config.state.weather = 'stormy';
        this.config.state.storms++;
        this.emit('storm');
        break;
      case 'treasure':
        console.log(chalk.green('💎 TREASURE EVENT: New discovery!'));
        this.config.state.treasures++;
        this.emit('treasure');
        break;
    }
    
    await this.save();
  }
  
  private getEventMessage(eventType: string): string {
    const messages: Record<string, string[]> = {
      'tide': [
        'The tide is coming in...',
        'Waves wash over the shore...',
        'The sea reclaims the beach...'
      ],
      'storm': [
        'Storm clouds gather!',
        'Thunder rumbles in the distance!',
        'The winds are picking up!'
      ],
      'treasure': [
        'Something glimmers in the sand!',
        'A discovery has been made!',
        'Treasure revealed by the tide!'
      ]
    };
    
    const eventMessages = messages[eventType] || ['Something is happening...'];
    return eventMessages[Math.floor(Math.random() * eventMessages.length)];
  }
}

// Island Spirit - The MCPx participant that represents the island
class IslandSpirit extends MCPxClient {
  private islandConfig: IslandConfig;
  
  constructor(config: IslandConfig, harbor: string) {
    super({
      serverUrl: harbor,
      topic: config.name,
      participantId: `island-${config.name}`,
      participantName: `${config.name} Island Spirit`
    });
    
    this.islandConfig = config;
    this.setupTools();
  }
  
  private setupTools(): void {
    // The island spirit provides MCP tools
    this.on('connected', () => {
      this.announcePresence();
    });
    
    this.on('message', (envelope) => {
      if (envelope.data?.type === 'mcp.request') {
        this.handleToolRequest(envelope);
      }
    });
  }
  
  private announcePresence(): void {
    this.send({
      type: 'presence',
      status: 'joined',
      role: 'island',
      tools: [
        {
          name: 'describe_island',
          description: 'Get island description and current state'
        },
        {
          name: 'list_resources',
          description: 'List available island resources'
        },
        {
          name: 'check_weather',
          description: 'Get current island weather conditions'
        },
        {
          name: 'ring_bell',
          description: 'Ring the island bell to announce something'
        },
        {
          name: 'bury_treasure',
          description: 'Store an artifact on the island'
        },
        {
          name: 'find_treasure',
          description: 'Search for buried treasures'
        }
      ]
    });
  }
  
  private async handleToolRequest(envelope: any): Promise<void> {
    const { method, params, id } = envelope.data;
    let result: any;
    
    try {
      switch (method) {
        case 'describe_island':
          result = {
            name: this.islandConfig.name,
            description: this.islandConfig.description,
            climate: this.islandConfig.climate,
            inhabitants: this.islandConfig.state.inhabitants,
            weather: this.islandConfig.state.weather,
            lastActivity: this.islandConfig.state.lastActivity
          };
          break;
          
        case 'list_resources':
          result = {
            resources: this.islandConfig.resources,
            available: true
          };
          break;
          
        case 'check_weather':
          result = {
            current: this.islandConfig.state.weather,
            forecast: this.generateForecast()
          };
          break;
          
        case 'ring_bell':
          this.send({
            type: 'chat',
            content: `🔔 *DONG* *DONG* *DONG* The island bell rings! ${params?.message || ''}`
          });
          result = { success: true };
          break;
          
        case 'bury_treasure':
          this.islandConfig.state.treasures++;
          result = {
            success: true,
            location: `treasure-${Date.now()}`,
            message: 'Treasure buried safely on the island'
          };
          break;
          
        case 'find_treasure':
          if (this.islandConfig.state.treasures > 0) {
            result = {
              found: true,
              treasure: `Ancient artifact #${this.islandConfig.state.treasures}`,
              value: 'priceless'
            };
          } else {
            result = {
              found: false,
              message: 'No treasures found... yet'
            };
          }
          break;
          
        default:
          throw new Error(`Unknown tool: ${method}`);
      }
      
      this.send({
        type: 'mcp.response',
        id,
        result
      }, envelope.from);
      
    } catch (error: any) {
      this.send({
        type: 'mcp.response',
        id,
        error: {
          code: -32603,
          message: error.message
        }
      }, envelope.from);
    }
  }
  
  private generateForecast(): string {
    const forecasts = [
      'Clear skies ahead',
      'Storms brewing on the horizon',
      'Fog rolling in by evening',
      'Perfect sailing weather continues',
      'Choppy waters expected'
    ];
    return forecasts[Math.floor(Math.random() * forecasts.length)];
  }
  
  // Send periodic events
  startEventCycle(): void {
    // Tide every 6 hours
    setInterval(() => {
      this.send({
        type: 'event',
        event: 'tide',
        message: 'The tide is coming in...'
      });
    }, 6 * 60 * 60 * 1000);
    
    // Random weather changes
    setInterval(() => {
      const weathers = ['calm', 'partly-cloudy', 'stormy', 'foggy'];
      const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
      if (newWeather !== this.islandConfig.state.weather) {
        this.islandConfig.state.weather = newWeather as any;
        this.send({
          type: 'event',
          event: 'weather_change',
          weather: newWeather,
          message: `The weather is changing to ${newWeather}`
        });
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }
}