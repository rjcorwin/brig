import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Sea } from '../lib/Sea';
import { Island } from '../lib/Island';

export async function islandCommands(action: string, name?: string, options: any = {}) {
  try {
    const currentSeaPath = await Sea.getCurrentSea();
    if (!currentSeaPath && action !== 'help') {
      console.error(chalk.red('⚠️  No sea selected. Use "brig sea switch <name>" first'));
      process.exit(1);
    }
    
    switch (action) {
      case 'create':
        if (!name) {
          console.error(chalk.red('⚠️  Please specify an island name'));
          process.exit(1);
        }
        await createIsland(currentSeaPath!, name, options);
        break;
        
      case 'list':
        await listIslands(currentSeaPath!);
        break;
        
      case 'describe':
        if (!name) {
          console.error(chalk.red('⚠️  Please specify an island name'));
          process.exit(1);
        }
        await describeIsland(currentSeaPath!, name);
        break;
        
      case 'visit':
        if (!name) {
          console.error(chalk.red('⚠️  Please specify an island name'));
          process.exit(1);
        }
        await visitIsland(currentSeaPath!, name);
        break;
        
      case 'weather':
        if (!name) {
          console.error(chalk.red('⚠️  Please specify an island name'));
          process.exit(1);
        }
        await checkWeather(currentSeaPath!, name);
        break;
        
      case 'event':
        if (!name) {
          console.error(chalk.red('⚠️  Please specify an island name and event type'));
          process.exit(1);
        }
        const eventType = options._?.[0];
        if (!eventType) {
          console.error(chalk.red('⚠️  Please specify an event type (tide, storm, treasure)'));
          process.exit(1);
        }
        await triggerEvent(currentSeaPath!, name, eventType);
        break;
        
      default:
        console.error(chalk.red(`⚠️  Unknown action: ${action}`));
        console.log('Available actions: create, list, describe, visit, weather, event');
        process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red('⚠️  Command failed:'), error.message);
    process.exit(1);
  }
}

async function createIsland(seaPath: string, name: string, options: any) {
  console.log(chalk.blue('🏝️  Creating new island...'));
  
  const island = await Island.create(seaPath, name, options);
  
  const sea = await Sea.load(seaPath);
  const config = sea.getConfig();
  if (!config.islands.includes(name)) {
    config.islands.push(name);
    await sea.saveConfig();
  }
  
  const brigConfig = path.join(seaPath, 'brig.yaml');
  if (await fs.pathExists(brigConfig)) {
    const content = await fs.readFile(brigConfig, 'utf-8');
    const harborMatch = content.match(/harbor:\s*(.+)/);
    if (harborMatch && harborMatch[1].trim() !== 'not-set') {
      await island.awakenSpirit(harborMatch[1].trim());
    }
  }
}

async function listIslands(seaPath: string) {
  const sea = await Sea.load(seaPath);
  const config = sea.getConfig();
  
  if (config.islands.length === 0) {
    console.log(chalk.yellow('No islands discovered yet.'));
    console.log(chalk.gray('Create one with: brig island create <name>'));
    return;
  }
  
  console.log(chalk.blue('🏝️  Islands in this sea:'));
  
  for (const islandName of config.islands) {
    try {
      const island = await Island.load(seaPath, islandName);
      const islandConfig = island.getConfig();
      const weather = island.getWeather();
      
      console.log();
      console.log(chalk.cyan(`  ${islandName}`), weather);
      console.log(chalk.gray(`    "${islandConfig.description}"`));
      
      if (islandConfig.resources.length > 0) {
        console.log(chalk.gray('    Resources:'), islandConfig.resources.join(', '));
      }
      
      console.log(chalk.gray('    Inhabitants:'), islandConfig.state.inhabitants || 'uninhabited');
      console.log(chalk.gray('    Treasures:'), islandConfig.state.treasures || 'none found');
    } catch (error) {
      console.log(chalk.red(`  ${islandName} (inaccessible)`));
    }
  }
}

async function describeIsland(seaPath: string, name: string) {
  const island = await Island.load(seaPath, name);
  const config = island.getConfig();
  
  console.log();
  console.log(chalk.blue('🏝️  Island:'), chalk.cyan(name));
  console.log(chalk.gray('━'.repeat(40)));
  console.log(chalk.gray('Description:'), config.description);
  console.log(chalk.gray('Climate:'), config.climate);
  console.log(chalk.gray('Weather:'), island.getWeather());
  console.log(chalk.gray('Created:'), new Date(config.created).toLocaleDateString());
  
  if (config.resources.length > 0) {
    console.log();
    console.log(chalk.blue('📦 Resources:'));
    for (const resource of config.resources) {
      console.log('  •', resource);
    }
  }
  
  console.log();
  console.log(chalk.blue('📊 Statistics:'));
  console.log('  Inhabitants:', config.state.inhabitants || 'none');
  console.log('  Treasures found:', config.state.treasures || 0);
  console.log('  Storms weathered:', config.state.storms || 0);
  console.log('  Last activity:', new Date(config.state.lastActivity).toLocaleString());
  
  if (config.events.length > 0) {
    console.log();
    console.log(chalk.blue('⚡ Events:'));
    for (const event of config.events) {
      console.log(`  • ${event.type}:`, event.schedule || event.trigger);
    }
  }
}

async function visitIsland(seaPath: string, name: string) {
  const island = await Island.load(seaPath, name);
  const config = island.getConfig();
  
  console.log();
  console.log(chalk.blue('🚢 Approaching'), chalk.cyan(name), chalk.blue('island...'));
  console.log();
  console.log(chalk.gray(`You see: ${config.description}`));
  console.log(chalk.gray(`The weather is ${config.state.weather}.`));
  
  if (config.state.inhabitants > 0) {
    console.log(chalk.yellow(`There are ${config.state.inhabitants} crew members here.`));
  } else {
    console.log(chalk.gray('The island appears uninhabited.'));
  }
  
  if (config.resources.length > 0) {
    console.log();
    console.log(chalk.green('Available resources:'));
    for (const resource of config.resources) {
      console.log('  📦', resource);
    }
  }
  
  console.log();
  console.log(chalk.blue('What would you like to do?'));
  console.log(chalk.gray('  • brig ashore'), name, chalk.gray('- Join the island communication'));
  console.log(chalk.gray('  • brig explore'), name, chalk.gray('- Interact with island resources'));
  console.log(chalk.gray('  • brig sail <crew>'), name, chalk.gray('- Deploy crew to this island'));
}

async function checkWeather(seaPath: string, name: string) {
  const island = await Island.load(seaPath, name);
  const weather = island.getWeather();
  
  console.log();
  console.log(chalk.blue('🏝️'), chalk.cyan(name), chalk.blue('island weather:'));
  console.log('  Current:', weather);
  console.log('  Forecast:', chalk.gray('Use "brig explore ' + name + '" to check with the island spirit'));
}

async function triggerEvent(seaPath: string, name: string, eventType: string) {
  const island = await Island.load(seaPath, name);
  
  console.log();
  console.log(chalk.yellow('⚡ Triggering event on'), chalk.cyan(name), chalk.yellow('island...'));
  
  await island.triggerEvent(eventType);
  await island.save();
  
  console.log(chalk.green('✨ Event triggered successfully!'));
}