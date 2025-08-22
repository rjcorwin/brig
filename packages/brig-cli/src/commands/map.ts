import chalk from 'chalk';
import * as path from 'path';
import { Sea } from '../lib/Sea';
import { Island } from '../lib/Island';
import { CrewMember } from '../types';

export async function mapCommand(options: any = {}) {
  try {
    const currentSeaPath = await Sea.getCurrentSea();
    if (!currentSeaPath) {
      console.error(chalk.red('⚠️  No sea selected. Use "brig sea switch <name>" first'));
      process.exit(1);
    }
    
    const sea = await Sea.load(currentSeaPath);
    const config = sea.getConfig();
    
    if (options.zoom) {
      await showIslandDetail(currentSeaPath, options.zoom);
    } else {
      await showSeaMap(sea, currentSeaPath, options.live);
    }
    
  } catch (error: any) {
    console.error(chalk.red('⚠️  Failed to display map:'), error.message);
    process.exit(1);
  }
}

async function showSeaMap(sea: Sea, seaPath: string, live: boolean = false) {
  const config = sea.getConfig();
  
  console.log();
  console.log(chalk.blue('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue('║'), chalk.cyan.bold(`           🌊 ${config.name.toUpperCase()} SEA 🌊           `).padEnd(58), chalk.blue('║'));
  console.log(chalk.blue('╠═══════════════════════════════════════════════════════════╣'));
  
  if (config.harbor) {
    console.log(chalk.blue('║'), chalk.gray('Harbor:'), chalk.green(config.harbor.padEnd(50)), chalk.blue('║'));
  } else {
    console.log(chalk.blue('║'), chalk.gray('Harbor:'), chalk.yellow('Not configured'.padEnd(50)), chalk.blue('║'));
  }
  
  console.log(chalk.blue('╠═══════════════════════════════════════════════════════════╣'));
  console.log(chalk.blue('║'), chalk.cyan('                    ISLANDS                               '), chalk.blue('║'));
  console.log(chalk.blue('╠═══════════════════════════════════════════════════════════╣'));
  
  if (config.islands.length === 0) {
    console.log(chalk.blue('║'), chalk.gray('        No islands discovered yet                         '), chalk.blue('║'));
  } else {
    for (const islandName of config.islands) {
      try {
        const island = await Island.load(seaPath, islandName);
        const islandConfig = island.getConfig();
        const weatherIcon = getWeatherIcon(islandConfig.state.weather);
        
        const islandLine = `  ${weatherIcon} ${islandName} (${islandConfig.state.inhabitants} crew)`;
        console.log(chalk.blue('║'), islandLine.padEnd(58), chalk.blue('║'));
        
        if (islandConfig.resources.length > 0) {
          const resourceLine = `      📦 ${islandConfig.resources.slice(0, 3).join(', ')}`;
          console.log(chalk.blue('║'), chalk.gray(resourceLine.padEnd(58)), chalk.blue('║'));
        }
      } catch (error) {
        console.log(chalk.blue('║'), chalk.red(`  ❌ ${islandName} (inaccessible)`.padEnd(58)), chalk.blue('║'));
      }
    }
  }
  
  console.log(chalk.blue('╠═══════════════════════════════════════════════════════════╣'));
  console.log(chalk.blue('║'), chalk.cyan('                     CREW                                 '), chalk.blue('║'));
  console.log(chalk.blue('╠═══════════════════════════════════════════════════════════╣'));
  
  if (config.crew.length === 0) {
    console.log(chalk.blue('║'), chalk.gray('        No crew recruited yet                             '), chalk.blue('║'));
  } else {
    const crewSummary = `  Total: ${config.crew.length} members`;
    console.log(chalk.blue('║'), crewSummary.padEnd(58), chalk.blue('║'));
  }
  
  console.log(chalk.blue('╠═══════════════════════════════════════════════════════════╣'));
  console.log(chalk.blue('║'), chalk.cyan('                    CHARTS                                '), chalk.blue('║'));
  console.log(chalk.blue('╠═══════════════════════════════════════════════════════════╣'));
  
  if (config.charts.length === 0) {
    console.log(chalk.blue('║'), chalk.gray('        No navigation charts available                    '), chalk.blue('║'));
  } else {
    for (const chart of config.charts) {
      console.log(chalk.blue('║'), (`  🗺️  ${chart}`).padEnd(58), chalk.blue('║'));
    }
  }
  
  console.log(chalk.blue('╚═══════════════════════════════════════════════════════════╝'));
  
  console.log();
  console.log(chalk.gray('Commands:'));
  console.log(chalk.gray('  • brig map -z <island>    - Zoom into specific island'));
  console.log(chalk.gray('  • brig island list        - List all islands'));
  console.log(chalk.gray('  • brig crew               - Show crew roster'));
}

async function showIslandDetail(seaPath: string, islandName: string) {
  const island = await Island.load(seaPath, islandName);
  const config = island.getConfig();
  
  const mapWidth = 60;
  const mapHeight = 20;
  
  console.log();
  console.log(chalk.blue('╔' + '═'.repeat(mapWidth) + '╗'));
  console.log(chalk.blue('║'), chalk.cyan.bold(islandName.toUpperCase().padStart(mapWidth/2 + islandName.length/2).padEnd(mapWidth - 2)), chalk.blue('║'));
  console.log(chalk.blue('╠' + '═'.repeat(mapWidth) + '╣'));
  
  const asciiIsland = generateIslandASCII(config.climate);
  const lines = asciiIsland.split('\n');
  
  for (let i = 0; i < mapHeight - 5; i++) {
    if (i < lines.length) {
      console.log(chalk.blue('║'), lines[i].padEnd(mapWidth - 2), chalk.blue('║'));
    } else {
      console.log(chalk.blue('║'), ' '.repeat(mapWidth - 2), chalk.blue('║'));
    }
  }
  
  console.log(chalk.blue('╠' + '═'.repeat(mapWidth) + '╣'));
  
  const weatherLine = `Weather: ${island.getWeather()}`;
  const inhabitantsLine = `Inhabitants: ${config.state.inhabitants}`;
  const treasuresLine = `Treasures: ${config.state.treasures}`;
  
  console.log(chalk.blue('║'), weatherLine.padEnd(mapWidth - 2), chalk.blue('║'));
  console.log(chalk.blue('║'), inhabitantsLine.padEnd(mapWidth - 2), chalk.blue('║'));
  console.log(chalk.blue('║'), treasuresLine.padEnd(mapWidth - 2), chalk.blue('║'));
  
  console.log(chalk.blue('╚' + '═'.repeat(mapWidth) + '╝'));
}

function getWeatherIcon(weather: string): string {
  const icons: Record<string, string> = {
    'calm': '☀️',
    'partly-cloudy': '⛅',
    'stormy': '⛈️',
    'foggy': '🌫️'
  };
  return icons[weather] || '🌤️';
}

function generateIslandASCII(climate: string): string {
  const templates: Record<string, string> = {
    'tropical': `
                    🌴
                 🌴 🏝️  🌴
              🌊 ~~~~~~~~ 🌊
            🌊 ~~~~~~~~~~~~ 🌊
          🌊 ~~~~~~~~~~~~~~~~ 🌊
        🌊 ~~~~~~~~~~~~~~~~~~~~ 🌊`,
    
    'arctic': `
                    ❄️
                 🏔️ ⛄ 🏔️
              ❄️ ~~~~~~~~ ❄️
            ❄️ ~~~~~~~~~~~~ ❄️
          ❄️ ~~~~~~~~~~~~~~~~ ❄️
        ❄️ ~~~~~~~~~~~~~~~~~~~~ ❄️`,
    
    'busy': `
                    🏭
                 🏢 🏗️  🏢
              🚢 ~~~~~~~~ 🚢
            ⚓ ~~~~~~~~~~~~ ⚓
          🌊 ~~~~~~~~~~~~~~~~ 🌊
        🌊 ~~~~~~~~~~~~~~~~~~~~ 🌊`,
    
    'stormy': `
                    ⛈️
                 ⚡ 🌩️  ⚡
              🌊 ~~~~~~~~ 🌊
            🌊 ~~~~~~~~~~~~ 🌊
          🌊 ~~~~~~~~~~~~~~~~ 🌊
        🌊 ~~~~~~~~~~~~~~~~~~~~ 🌊`,
    
    'calm': `
                    ☀️
                 🏝️  🦜  🏝️
              🌊 ~~~~~~~~ 🌊
            🌊 ~~~~~~~~~~~~ 🌊
          🌊 ~~~~~~~~~~~~~~~~ 🌊
        🌊 ~~~~~~~~~~~~~~~~~~~~ 🌊`
  };
  
  return templates[climate] || templates['calm'];
}