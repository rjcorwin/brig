import chalk from 'chalk';
import figlet from 'figlet';

export function printBanner() {
  console.log(
    chalk.cyan(
      figlet.textSync('BRIG', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      })
    )
  );
  console.log(chalk.blue('  ⚓ Navigate the Caribbean of MCPx agents ⚓'));
  console.log(chalk.gray('  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
  console.log();
}

export function printSeaBanner(seaName: string) {
  console.log(chalk.blue('\n  🌊 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 🌊'));
  console.log(chalk.cyan(`     Welcome to the ${chalk.bold(seaName)} Sea`));
  console.log(chalk.blue('  🌊 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 🌊\n'));
}