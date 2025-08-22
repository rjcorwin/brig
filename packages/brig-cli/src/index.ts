#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { seaCommands } from './commands/sea';
import { islandCommands } from './commands/island';
import { mapCommand } from './commands/map';
import { initCommand } from './commands/init';
import { harborCommand } from './commands/harbor';
import { recruitCommand } from './commands/recruit';
import { sailCommand } from './commands/sail';
import { ashoreCommand } from './commands/ashore';
import { exploreCommand } from './commands/explore';
import { crewCommand } from './commands/crew';
import { voyageCommand } from './commands/voyage';
import { anchorCommand } from './commands/anchor';
import { weighCommand } from './commands/weigh';
import { treasureCommand } from './commands/treasure';
import { weatherCommand } from './commands/weather';
import { printBanner } from './utils/banner';

const program = new Command();

// Print the banner on startup
printBanner();

program
  .name('brig')
  .description(chalk.cyan('⚓ Brig - Navigate the Caribbean of MCPx agents'))
  .version('0.1.0');

// Sea management
program
  .command('init [path]')
  .description('Initialize a new sea (project workspace)')
  .option('-n, --name <name>', 'Name of the sea')
  .option('-t, --template <template>', 'Use a template sea configuration')
  .action(initCommand);

program
  .command('sea <action> [name]')
  .description('Manage different seas (list, switch, current, status)')
  .action(seaCommands);

// Island management
program
  .command('island <action> [name]')
  .description('Create and manage persistent islands')
  .option('-d, --description <desc>', 'Island description')
  .option('-r, --resources <resources>', 'Comma-separated list of resources')
  .option('-c, --climate <climate>', 'Island climate/personality')
  .option('-e, --events <events>', 'Scheduled events')
  .action(islandCommands);

// Navigation
program
  .command('map')
  .description('Display visual overview of your maritime domain')
  .option('-z, --zoom <island>', 'Zoom into specific island')
  .option('-l, --live', 'Show live activity')
  .action(mapCommand);

program
  .command('harbor [url]')
  .description('Configure MCPx gateway connection')
  .option('-g, --global', 'Set as global default')
  .action(harborCommand);

// Crew management
program
  .command('recruit <role> <name>')
  .description('Recruit crew members from available roles')
  .option('-l, --list', 'List available roles')
  .option('-i, --inspect', 'Inspect role details')
  .action(recruitCommand);

program
  .command('crew [island]')
  .description('List crew members')
  .option('--idle', 'Show only idle crew')
  .option('--manifest', 'Show crew capabilities')
  .action(crewCommand);

// Deployment
program
  .command('sail <agent> <island>')
  .description('Deploy agent to island')
  .option('-f, --fleet <fleet>', 'Deploy entire fleet')
  .option('-a, --all', 'Deploy all agents')
  .action(sailCommand);

program
  .command('anchor [agent]')
  .description('Stop/pause agents')
  .option('-i, --island <island>', 'Stop all on island')
  .action(anchorCommand);

program
  .command('weigh [agent]')
  .description('Resume agents')
  .option('-i, --island <island>', 'Resume all on island')
  .action(weighCommand);

// Communication
program
  .command('ashore <island>')
  .description('Join island chat/communication')
  .option('-o, --observe', 'Join in read-only mode')
  .option('--as <identity>', 'Join with specific identity')
  .action(ashoreCommand);

program
  .command('explore <island>')
  .description('Interact with island spirit and resources')
  .action(exploreCommand);

// Operations
program
  .command('voyage <mission>')
  .description('Execute coordinated multi-island operations')
  .option('-c, --chart <chart>', 'Use specific chart')
  .option('-i, --interactive', 'Manual helm control')
  .action(voyageCommand);

// Monitoring
program
  .command('weather')
  .description('System health and conditions')
  .option('-f, --forecast', 'Show predictive analysis')
  .option('-s, --storms', 'Show problems only')
  .action(weatherCommand);

program
  .command('treasure')
  .description('View completed missions and results')
  .option('-v, --voyage <id>', 'Specific voyage results')
  .option('-g, --gold', 'High-value outcomes only')
  .action(treasureCommand);

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (err: any) {
  console.error(chalk.red('⚠️  ' + err.message));
  process.exit(1);
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}