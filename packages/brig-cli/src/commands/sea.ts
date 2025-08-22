import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Sea } from '../lib/Sea';
import { printSeaBanner } from '../utils/banner';

export async function seaCommands(action: string, name?: string) {
  try {
    switch (action) {
      case 'list':
        await listSeas();
        break;
        
      case 'switch':
        if (!name) {
          console.error(chalk.red('⚠️  Please specify a sea name or path'));
          process.exit(1);
        }
        await switchSea(name);
        break;
        
      case 'current':
        await showCurrentSea();
        break;
        
      case 'status':
        await showSeaStatus();
        break;
        
      default:
        console.error(chalk.red(`⚠️  Unknown action: ${action}`));
        console.log('Available actions: list, switch, current, status');
        process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red('⚠️  Command failed:'), error.message);
    process.exit(1);
  }
}

async function listSeas() {
  const seas = await Sea.listSeas();
  const currentSea = await Sea.getCurrentSea();
  
  if (seas.length === 0) {
    console.log(chalk.yellow('No seas registered yet.'));
    console.log(chalk.gray('Create one with: brig init [path]'));
    return;
  }
  
  console.log(chalk.blue('🌊 Known Seas:'));
  for (const seaPath of seas) {
    const seaName = path.basename(seaPath);
    const isCurrent = seaPath === currentSea;
    
    if (isCurrent) {
      console.log(chalk.cyan('  ▸'), chalk.bold(seaName), chalk.gray(`(${seaPath})`));
    } else {
      console.log('   ', seaName, chalk.gray(`(${seaPath})`));
    }
  }
}

async function switchSea(nameOrPath: string) {
  let seaPath: string;
  
  if (nameOrPath.includes('/') || nameOrPath.includes('\\')) {
    seaPath = path.resolve(nameOrPath);
  } else {
    const seas = await Sea.listSeas();
    const match = seas.find(s => path.basename(s) === nameOrPath);
    if (!match) {
      console.error(chalk.red(`⚠️  Sea '${nameOrPath}' not found`));
      console.log(chalk.gray('Use "brig sea list" to see available seas'));
      process.exit(1);
    }
    seaPath = match;
  }
  
  if (!await fs.pathExists(path.join(seaPath, 'brig.yaml'))) {
    console.error(chalk.red(`⚠️  No sea found at ${seaPath}`));
    process.exit(1);
  }
  
  await Sea.setCurrentSea(seaPath);
  const sea = await Sea.load(seaPath);
  
  printSeaBanner(sea.getName());
  console.log(chalk.green('⚓ Switched to sea:'), chalk.cyan(sea.getName()));
  console.log(chalk.gray('  Path:'), seaPath);
}

async function showCurrentSea() {
  const currentSeaPath = await Sea.getCurrentSea();
  
  if (!currentSeaPath) {
    console.log(chalk.yellow('No sea currently selected.'));
    console.log(chalk.gray('Use "brig sea switch <name>" to select a sea'));
    return;
  }
  
  const sea = await Sea.load(currentSeaPath);
  console.log(chalk.blue('🌊 Current Sea:'), chalk.cyan(sea.getName()));
  console.log(chalk.gray('  Path:'), currentSeaPath);
}

async function showSeaStatus() {
  const currentSeaPath = await Sea.getCurrentSea();
  
  if (!currentSeaPath) {
    console.log(chalk.yellow('No sea currently selected.'));
    return;
  }
  
  const sea = await Sea.load(currentSeaPath);
  const config = sea.getConfig();
  
  printSeaBanner(sea.getName());
  
  console.log(chalk.blue('📊 Sea Status:'));
  console.log(chalk.gray('  Created:'), new Date(config.created).toLocaleDateString());
  console.log(chalk.gray('  Harbor:'), config.harbor || chalk.yellow('not configured'));
  
  if (config.islands.length > 0) {
    console.log(chalk.gray('  Islands:'), config.islands.length);
    for (const island of config.islands) {
      console.log('    🏝️ ', island);
    }
  } else {
    console.log(chalk.gray('  Islands:'), chalk.yellow('none'));
  }
  
  if (config.crew.length > 0) {
    console.log(chalk.gray('  Crew:'), config.crew.length);
    for (const member of config.crew) {
      console.log('    👤', member);
    }
  } else {
    console.log(chalk.gray('  Crew:'), chalk.yellow('none'));
  }
  
  if (config.charts.length > 0) {
    console.log(chalk.gray('  Charts:'), config.charts.length);
    for (const chart of config.charts) {
      console.log('    🗺️ ', chart);
    }
  } else {
    console.log(chalk.gray('  Charts:'), chalk.yellow('none'));
  }
}