import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { BrigConfig, SeaConfig } from '../types';

export class Sea {
  private seaPath: string;
  private config!: SeaConfig;
  
  constructor(seaPath: string) {
    this.seaPath = path.resolve(seaPath);
  }
  
  static async init(seaPath: string, name?: string): Promise<Sea> {
    const sea = new Sea(seaPath);
    await sea.initialize(name);
    return sea;
  }
  
  private async initialize(name?: string) {
    const seaName = name || path.basename(this.seaPath);
    
    // Create directory structure
    await fs.ensureDir(this.seaPath);
    await fs.ensureDir(path.join(this.seaPath, 'crew-roles'));
    await fs.ensureDir(path.join(this.seaPath, 'charts'));
    await fs.ensureDir(path.join(this.seaPath, 'islands'));
    await fs.ensureDir(path.join(this.seaPath, 'treasure'));
    await fs.ensureDir(path.join(this.seaPath, 'logs'));
    await fs.ensureDir(path.join(this.seaPath, '.brig'));
    await fs.ensureDir(path.join(this.seaPath, '.brig', 'crew'));
    await fs.ensureDir(path.join(this.seaPath, '.brig', 'pids'));
    await fs.ensureDir(path.join(this.seaPath, '.brig', 'islands'));
    
    // Create default configuration
    this.config = {
      name: seaName,
      created: new Date().toISOString(),
      harbor: '',
      islands: [],
      crew: [],
      charts: []
    };
    
    await this.saveConfig();
    
    // Create default crew roles
    await this.createDefaultRoles();
    
    // Create example chart
    await this.createExampleChart();
    
    console.log(chalk.blue('🌊 Initializing new sea at'), chalk.cyan(this.seaPath));
    console.log(chalk.green('📁 Created crew-roles:'), 'navigator, quartermaster, bosun, lookout');
    console.log(chalk.green('🗺️  Created example chart:'), 'daily-patrol.yaml');
    console.log(chalk.green('⚓ Sea'), chalk.cyan(`'${seaName}'`), chalk.green('ready for exploration!'));
  }
  
  async saveConfig() {
    const configPath = path.join(this.seaPath, 'brig.yaml');
    const yaml = this.configToYaml(this.config);
    await fs.writeFile(configPath, yaml);
  }
  
  private configToYaml(config: SeaConfig): string {
    // Simple YAML generation (we'll use a proper library later)
    let yaml = `# Brig Sea Configuration\n`;
    yaml += `name: ${config.name}\n`;
    yaml += `created: ${config.created}\n`;
    yaml += `harbor: ${config.harbor || 'not-set'}\n`;
    yaml += `\nislands:\n`;
    config.islands.forEach(island => {
      yaml += `  - ${island}\n`;
    });
    yaml += `\ncrew:\n`;
    config.crew.forEach(member => {
      yaml += `  - ${member}\n`;
    });
    yaml += `\ncharts:\n`;
    config.charts.forEach(chart => {
      yaml += `  - ${chart}\n`;
    });
    return yaml;
  }
  
  private async createDefaultRoles() {
    const roles = ['navigator', 'quartermaster', 'bosun', 'lookout'];
    
    for (const role of roles) {
      const roleDir = path.join(this.seaPath, 'crew-roles', role);
      await fs.ensureDir(roleDir);
      
      // Create role manifest
      const manifest = {
        name: role,
        description: this.getRoleDescription(role),
        capabilities: this.getRoleCapabilities(role),
        template: 'basic'
      };
      
      await fs.writeJson(path.join(roleDir, 'role.json'), manifest, { spaces: 2 });
      
      // Create basic implementation
      const implementation = this.getRoleImplementation(role);
      await fs.writeFile(path.join(roleDir, 'index.js'), implementation);
    }
  }
  
  private getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      navigator: 'Pathfinding and routing specialist',
      quartermaster: 'Resource and inventory management',
      bosun: 'Task coordinator and crew management',
      lookout: 'Monitoring and alerting specialist'
    };
    return descriptions[role] || 'Crew member';
  }
  
  private getRoleCapabilities(role: string): string[] {
    const capabilities: Record<string, string[]> = {
      navigator: ['route_planning', 'path_optimization', 'island_discovery'],
      quartermaster: ['resource_tracking', 'inventory_management', 'supply_distribution'],
      bosun: ['task_assignment', 'crew_coordination', 'workflow_management'],
      lookout: ['monitoring', 'alerting', 'threat_detection']
    };
    return capabilities[role] || [];
  }
  
  private getRoleImplementation(role: string): string {
    return `// ${role.charAt(0).toUpperCase() + role.slice(1)} Role Implementation
const { BrigAgent } = require('@mcpxp/brig-agent-sdk');

class ${role.charAt(0).toUpperCase() + role.slice(1)}Agent extends BrigAgent {
  constructor(config) {
    super(config);
    this.role = '${role}';
  }
  
  async onReady() {
    console.log(\`⚓ \${this.name} reporting for duty as ${role}!\`);
    
    // Register role-specific tools
    this.registerTool({
      name: 'status',
      description: 'Report current status',
      handler: async () => {
        return {
          role: this.role,
          status: 'ready',
          island: this.currentIsland
        };
      }
    });
  }
  
  async onMessage(message) {
    console.log(\`[\${this.role}] Received: \${message.content}\`);
    // Handle messages based on role
  }
}

module.exports = ${role.charAt(0).toUpperCase() + role.slice(1)}Agent;
`;
  }
  
  private async createExampleChart() {
    const chart = {
      name: 'daily-patrol',
      description: 'Daily patrol of all islands',
      route: [
        {
          island: 'monitoring',
          action: 'check_status',
          duration: '5m'
        },
        {
          island: 'data-processing',
          action: 'collect_metrics',
          duration: '10m'
        },
        {
          island: 'reporting',
          action: 'generate_report',
          duration: '5m'
        }
      ]
    };
    
    await fs.writeJson(
      path.join(this.seaPath, 'charts', 'daily-patrol.json'),
      chart,
      { spaces: 2 }
    );
  }
  
  static async load(seaPath: string): Promise<Sea> {
    const sea = new Sea(seaPath);
    const configPath = path.join(seaPath, 'brig.yaml');
    
    if (await fs.pathExists(configPath)) {
      // Load and parse config (simplified for now)
      const content = await fs.readFile(configPath, 'utf-8');
      sea.config = sea.parseYaml(content);
    } else {
      throw new Error(`No sea found at ${seaPath}`);
    }
    
    return sea;
  }
  
  private parseYaml(content: string): SeaConfig {
    // Simple YAML parsing (we'll use a proper library later)
    const lines = content.split('\n');
    const config: any = {
      islands: [],
      crew: [],
      charts: []
    };
    
    let currentSection = '';
    
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      if (!line.trim()) continue;
      
      if (line.startsWith('name:')) {
        config.name = line.split(':')[1].trim();
      } else if (line.startsWith('created:')) {
        config.created = line.split(':')[1].trim();
      } else if (line.startsWith('harbor:')) {
        config.harbor = line.split(':')[1].trim();
        if (config.harbor === 'not-set') config.harbor = '';
      } else if (line === 'islands:') {
        currentSection = 'islands';
      } else if (line === 'crew:') {
        currentSection = 'crew';
      } else if (line === 'charts:') {
        currentSection = 'charts';
      } else if (line.startsWith('  - ') && currentSection) {
        config[currentSection].push(line.substring(4).trim());
      }
    }
    
    return config as SeaConfig;
  }
  
  async setHarbor(url: string) {
    this.config.harbor = url;
    await this.saveConfig();
  }
  
  getPath(): string {
    return this.seaPath;
  }
  
  getName(): string {
    return this.config.name;
  }
  
  getConfig(): SeaConfig {
    return this.config;
  }
  
  static async getCurrentSea(): Promise<string | null> {
    const brigHome = path.join(os.homedir(), '.brig');
    const currentSeaFile = path.join(brigHome, 'current-sea');
    
    if (await fs.pathExists(currentSeaFile)) {
      return await fs.readFile(currentSeaFile, 'utf-8');
    }
    
    return null;
  }
  
  static async setCurrentSea(seaPath: string): Promise<void> {
    const brigHome = path.join(os.homedir(), '.brig');
    await fs.ensureDir(brigHome);
    const currentSeaFile = path.join(brigHome, 'current-sea');
    await fs.writeFile(currentSeaFile, path.resolve(seaPath));
  }
  
  static async listSeas(): Promise<string[]> {
    const brigHome = path.join(os.homedir(), '.brig');
    const seasFile = path.join(brigHome, 'known-seas');
    
    if (await fs.pathExists(seasFile)) {
      const content = await fs.readFile(seasFile, 'utf-8');
      return content.split('\n').filter(line => line.trim());
    }
    
    return [];
  }
  
  static async registerSea(seaPath: string): Promise<void> {
    const brigHome = path.join(os.homedir(), '.brig');
    await fs.ensureDir(brigHome);
    const seasFile = path.join(brigHome, 'known-seas');
    
    let seas: string[] = [];
    if (await fs.pathExists(seasFile)) {
      const content = await fs.readFile(seasFile, 'utf-8');
      seas = content.split('\n').filter(line => line.trim());
    }
    
    const resolvedPath = path.resolve(seaPath);
    if (!seas.includes(resolvedPath)) {
      seas.push(resolvedPath);
      await fs.writeFile(seasFile, seas.join('\n'));
    }
  }
}