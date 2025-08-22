import chalk from 'chalk';
import * as path from 'path';
import { Sea } from '../lib/Sea';

export async function initCommand(projectPath?: string, options: any = {}) {
  try {
    const seaPath = projectPath || process.cwd();
    const seaName = options.name || path.basename(path.resolve(seaPath));
    
    console.log(chalk.blue('🌊 Creating new sea...'));
    
    const sea = await Sea.init(seaPath, seaName);
    
    await Sea.registerSea(seaPath);
    await Sea.setCurrentSea(seaPath);
    
    console.log();
    console.log(chalk.green('✨ Your sea is ready!'));
    console.log();
    console.log('Next steps:');
    console.log(chalk.cyan('  1. Set your harbor:'), chalk.gray('brig harbor <mcpx-url>'));
    console.log(chalk.cyan('  2. Create an island:'), chalk.gray('brig island create <name>'));
    console.log(chalk.cyan('  3. Recruit crew:'), chalk.gray('brig recruit <role> <name>'));
    console.log(chalk.cyan('  4. Set sail:'), chalk.gray('brig sail <crew> <island>'));
    console.log();
    console.log(chalk.blue('⚓ Fair winds and following seas!'));
    
  } catch (error: any) {
    console.error(chalk.red('⚠️  Failed to initialize sea:'), error.message);
    process.exit(1);
  }
}