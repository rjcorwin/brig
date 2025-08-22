import chalk from 'chalk';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import { Sea } from '../lib/Sea';

export async function harborCommand(url?: string, options: any = {}) {
  try {
    if (!url) {
      await showCurrentHarbor(options.global);
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('ws://') && !url.startsWith('wss://')) {
      console.error(chalk.red('⚠️  Invalid harbor URL. Must start with http://, https://, ws://, or wss://'));
      process.exit(1);
    }
    
    if (options.global) {
      await setGlobalHarbor(url);
    } else {
      await setSeaHarbor(url);
    }
    
  } catch (error: any) {
    console.error(chalk.red('⚠️  Failed to configure harbor:'), error.message);
    process.exit(1);
  }
}

async function showCurrentHarbor(global: boolean) {
  if (global) {
    const brigHome = path.join(os.homedir(), '.brig');
    const globalHarborFile = path.join(brigHome, 'global-harbor');
    
    if (await fs.pathExists(globalHarborFile)) {
      const harbor = await fs.readFile(globalHarborFile, 'utf-8');
      console.log(chalk.blue('🚢 Global Harbor:'), chalk.green(harbor));
    } else {
      console.log(chalk.yellow('No global harbor configured'));
      console.log(chalk.gray('Set one with: brig harbor <url> --global'));
    }
  } else {
    const currentSeaPath = await Sea.getCurrentSea();
    if (!currentSeaPath) {
      console.error(chalk.red('⚠️  No sea selected. Use "brig sea switch <name>" first'));
      process.exit(1);
    }
    
    const sea = await Sea.load(currentSeaPath);
    const config = sea.getConfig();
    
    if (config.harbor) {
      console.log(chalk.blue('🚢 Harbor for'), chalk.cyan(config.name + ':'), chalk.green(config.harbor));
    } else {
      console.log(chalk.yellow(`No harbor configured for ${config.name}`));
      console.log(chalk.gray('Set one with: brig harbor <url>'));
      
      const brigHome = path.join(os.homedir(), '.brig');
      const globalHarborFile = path.join(brigHome, 'global-harbor');
      if (await fs.pathExists(globalHarborFile)) {
        const globalHarbor = await fs.readFile(globalHarborFile, 'utf-8');
        console.log(chalk.gray('Global harbor available:'), globalHarbor);
        console.log(chalk.gray('Use it with: brig harbor'), globalHarbor);
      }
    }
  }
}

async function setGlobalHarbor(url: string) {
  const brigHome = path.join(os.homedir(), '.brig');
  await fs.ensureDir(brigHome);
  
  const globalHarborFile = path.join(brigHome, 'global-harbor');
  await fs.writeFile(globalHarborFile, url);
  
  console.log(chalk.green('✅ Global harbor configured:'), chalk.cyan(url));
  console.log(chalk.gray('All new seas will use this harbor by default'));
}

async function setSeaHarbor(url: string) {
  const currentSeaPath = await Sea.getCurrentSea();
  if (!currentSeaPath) {
    console.error(chalk.red('⚠️  No sea selected. Use "brig sea switch <name>" first'));
    process.exit(1);
  }
  
  const sea = await Sea.load(currentSeaPath);
  await sea.setHarbor(url);
  
  console.log(chalk.green('✅ Harbor configured for'), chalk.cyan(sea.getName() + ':'), chalk.green(url));
  
  console.log();
  console.log(chalk.blue('⚓ Your fleet can now connect to MCPx!'));
  console.log();
  console.log('Next steps:');
  console.log(chalk.gray('  • Create islands:'), 'brig island create <name>');
  console.log(chalk.gray('  • Recruit crew:'), 'brig recruit <role> <name>');
  console.log(chalk.gray('  • Deploy agents:'), 'brig sail <crew> <island>');
}