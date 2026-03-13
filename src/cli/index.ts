#!/usr/bin/env node

/**
 * Agent Commercial Contract - CLI Interface
 * The Legal Layer for Agent-to-Agent Commerce
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import AgentCommercialContract from '../index';
import { ContractTerms, DisputeType } from '../core/types';

const sdk = new AgentCommercialContract();
const program = new Command();

program
  .name('agent-contract')
  .description('The Legal Layer for Agent-to-Agent Commerce')
  .version('1.0.0');

// ============================================================================
// Agent Identity Commands
// ============================================================================

const agentCmd = program.command('agent').description('Manage agent identities');

agentCmd
  .command('register')
  .description('Register a new agent')
  .requiredOption('-n, --name <name>', 'Agent name')
  .option('-c, --capabilities <capabilities>', 'Comma-separated capabilities')
  .option('-e, --endpoint <url>', 'Agent API endpoint')
  .action(async (options) => {
    const spinner = ora('Registering agent...').start();

    try {
      const result = await sdk.identity.registerAgent(
        options.name,
        options.capabilities ? options.capabilities.split(',') : undefined,
        options.endpoint
      );

      if (result.success && result.data) {
        spinner.succeed('Agent registered successfully!');
        console.log('\n' + chalk.bold('Agent Identity:'));
        console.log(chalk.cyan(`  ID: ${result.data.identity.id}`));
        console.log(chalk.cyan(`  Name: ${result.data.identity.name}`));
        console.log(chalk.cyan(`  API Key: ${result.data.credentials.apiKey}`));
        console.log('\n' + chalk.yellow('⚠️  Save your credentials securely!'));
      } else {
        spinner.fail(result.error || 'Registration failed');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  });

agentCmd
  .command('list')
  .description('List all registered agents')
  .action(() => {
    const agents = sdk.identity.listAgents();
    console.log('\n' + chalk.bold(`Registered Agents (${agents.length}):\n`));

    if (agents.length === 0) {
      console.log(chalk.gray('  No agents registered yet.'));
      return;
    }

    agents.forEach((agent) => {
      console.log(chalk.cyan(`  ${agent.name}`));
      console.log(chalk.gray(`    ID: ${agent.id}`));
      console.log(chalk.gray(`    Capabilities: ${agent.capabilities?.join(', ') || 'None'}`));
      console.log('');
    });
  });

// ============================================================================
// Contract Commands
// ============================================================================

const contractCmd = program.command('contract').description('Manage contracts');

contractCmd
  .command('create')
  .description('Create a new contract')
  .requiredOption('-p, --provider <id>', 'Provider agent ID')
  .requiredOption('-c, --consumer <id>', 'Consumer agent ID')
  .requiredOption('-t, --title <title>', 'Contract title')
  .requiredOption('-s, --service <type>', 'Service type')
  .requiredOption('--spec <specification>', 'Service specification')
  .requiredOption('-a, --amount <amount>', 'Payment amount')
  .option('--currency <currency>', 'Payment currency', 'USD')
  .option('--description <desc>', 'Contract description')
  .option('--with-escrow', 'Create escrow account', false)
  .action(async (options) => {
    const spinner = ora('Creating contract...').start();

    try {
      const provider = sdk.identity.getAgent(options.provider);
      const consumer = sdk.identity.getAgent(options.consumer);

      if (!provider || !consumer) {
        spinner.fail('Provider or consumer agent not found');
        return;
      }

      const terms: ContractTerms = {
        title: options.title,
        description: options.description || options.title,
        service: {
          type: options.service,
          specification: options.spec,
          deliverables: [],
        },
        payment: {
          amount: parseFloat(options.amount),
          currency: options.currency,
          structure: 'fixed',
        },
        timeline: {},
      };

      let result;
      if (options.withEscrow) {
        result = await sdk.createContractWithEscrow(provider, consumer, terms);
      } else {
        result = await sdk.contracts.createContract({
          provider,
          consumer,
          terms,
        });
      }

      if (result.success && result.data) {
        spinner.succeed('Contract created successfully!');
        const contractId = 'contract' in result.data ? result.data.contract.id : result.data.id;
        console.log('\n' + chalk.bold('Contract Details:'));
        console.log(chalk.cyan(`  ID: ${contractId}`));
        console.log(chalk.cyan(`  Title: ${options.title}`));
        console.log(chalk.cyan(`  Provider: ${provider.name}`));
        console.log(chalk.cyan(`  Consumer: ${consumer.name}`));
        console.log(chalk.cyan(`  Amount: ${options.amount} ${options.currency}`));

        if (options.withEscrow && 'escrow' in result.data) {
          console.log(chalk.green(`\n  Escrow ID: ${result.data.escrow.id}`));
        }
      } else {
        spinner.fail(result.error || 'Contract creation failed');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  });

contractCmd
  .command('sign')
  .description('Sign a contract')
  .requiredOption('-i, --id <contractId>', 'Contract ID')
  .requiredOption('-a, --agent <agentId>', 'Agent ID')
  .requiredOption('-s, --signature <signature>', 'Digital signature')
  .action(async (options) => {
    const spinner = ora('Signing contract...').start();

    try {
      const result = await sdk.contracts.signContract({
        contractId: options.id,
        agentId: options.agent,
        signature: options.signature,
        credentials: {} as any,
      });

      if (result.success) {
        spinner.succeed(result.message || 'Contract signed successfully!');

        if (result.data && result.data.status === 'signed') {
          console.log(chalk.green('\n✓ Contract is fully signed and ready for activation'));
        }
      } else {
        spinner.fail(result.error || 'Signing failed');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  });

contractCmd
  .command('activate')
  .description('Activate a signed contract')
  .requiredOption('-i, --id <contractId>', 'Contract ID')
  .action(async (options) => {
    const spinner = ora('Activating contract...').start();

    try {
      const result = await sdk.contracts.activateContract(options.id, 'system');

      if (result.success) {
        spinner.succeed('Contract activated successfully!');
      } else {
        spinner.fail(result.error || 'Activation failed');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  });

contractCmd
  .command('list')
  .description('List all contracts')
  .option('-s, --status <status>', 'Filter by status')
  .option('-p, --provider <id>', 'Filter by provider')
  .option('-c, --consumer <id>', 'Filter by consumer')
  .action((options) => {
    const contracts = sdk.contracts.listContracts({
      status: options.status,
      providerId: options.provider,
      consumerId: options.consumer,
    });

    console.log('\n' + chalk.bold(`Contracts (${contracts.length}):\n`));

    if (contracts.length === 0) {
      console.log(chalk.gray('  No contracts found.'));
      return;
    }

    contracts.forEach((contract) => {
      const statusColor =
        contract.status === 'active' ? chalk.green :
        contract.status === 'completed' ? chalk.blue :
        contract.status === 'signed' ? chalk.yellow :
        chalk.gray;

      console.log(chalk.cyan(`  ${contract.terms.title}`));
      console.log(chalk.gray(`    ID: ${contract.id}`));
      console.log(statusColor(`    Status: ${contract.status}`));
      console.log(chalk.gray(`    Provider: ${contract.provider.name}`));
      console.log(chalk.gray(`    Consumer: ${contract.consumer.name}`));
      console.log(chalk.gray(`    Amount: ${contract.terms.payment.amount} ${contract.terms.payment.currency}`));
      console.log('');
    });
  });

contractCmd
  .command('info')
  .description('Get detailed contract information')
  .requiredOption('-i, --id <contractId>', 'Contract ID')
  .action((options) => {
    const info = sdk.getCompleteContractInfo(options.id);

    if (!info.contract) {
      console.log(chalk.red('\n  Contract not found.'));
      return;
    }

    console.log('\n' + chalk.bold('Contract Information:\n'));
    console.log(chalk.cyan(`  ID: ${info.contract.id}`));
    console.log(chalk.cyan(`  Title: ${info.contract.terms.title}`));
    console.log(chalk.cyan(`  Status: ${info.contract.status}`));
    console.log(chalk.cyan(`  Provider: ${info.contract.provider.name} (${info.contract.provider.id})`));
    console.log(chalk.cyan(`  Consumer: ${info.contract.consumer.name} (${info.contract.consumer.id})`));

    console.log('\n' + chalk.bold('Payment Terms:'));
    console.log(chalk.gray(`  Amount: ${info.contract.terms.payment.amount} ${info.contract.terms.payment.currency}`));
    console.log(chalk.gray(`  Structure: ${info.contract.terms.payment.structure}`));

    if (info.escrow) {
      console.log('\n' + chalk.bold('Escrow:'));
      console.log(chalk.gray(`  ID: ${info.escrow.id}`));
      console.log(chalk.gray(`  Status: ${info.escrow.status}`));
      console.log(chalk.gray(`  Balance: ${info.escrow.balance} ${info.escrow.currency}`));
    }

    if (info.disputes.length > 0) {
      console.log('\n' + chalk.bold('Disputes:'));
      info.disputes.forEach((dispute) => {
        console.log(chalk.yellow(`  ${dispute.type} - ${dispute.status}`));
      });
    }

    console.log('');
  });

// ============================================================================
// Escrow Commands
// ============================================================================

const escrowCmd = program.command('escrow').description('Manage escrow accounts');

escrowCmd
  .command('deposit')
  .description('Deposit funds into escrow')
  .requiredOption('-i, --id <escrowId>', 'Escrow ID')
  .requiredOption('-a, --amount <amount>', 'Deposit amount')
  .requiredOption('-f, --from <agentId>', 'Payer agent ID')
  .action(async (options) => {
    const spinner = ora('Depositing funds...').start();

    try {
      const result = await sdk.escrow.deposit(
        options.id,
        parseFloat(options.amount),
        options.from
      );

      if (result.success && result.data) {
        spinner.succeed(result.message || 'Deposit successful!');
        console.log(chalk.cyan(`  New balance: ${result.data.balance} ${result.data.currency}`));
      } else {
        spinner.fail(result.error || 'Deposit failed');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  });

escrowCmd
  .command('release')
  .description('Release funds from escrow')
  .requiredOption('-i, --id <escrowId>', 'Escrow ID')
  .requiredOption('-a, --amount <amount>', 'Release amount')
  .option('-r, --reason <reason>', 'Release reason')
  .action(async (options) => {
    const spinner = ora('Releasing funds...').start();

    try {
      const result = await sdk.escrow.release(
        options.id,
        parseFloat(options.amount),
        options.reason
      );

      if (result.success && result.data) {
        spinner.succeed(result.message || 'Release successful!');
        console.log(chalk.cyan(`  Remaining balance: ${result.data.balance} ${result.data.currency}`));
      } else {
        spinner.fail(result.error || 'Release failed');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  });

// ============================================================================
// Dispute Commands
// ============================================================================

const disputeCmd = program.command('dispute').description('Manage disputes');

disputeCmd
  .command('raise')
  .description('Raise a dispute')
  .requiredOption('-c, --contract <contractId>', 'Contract ID')
  .requiredOption('-p, --plaintiff <agentId>', 'Plaintiff agent ID')
  .requiredOption('-d, --defendant <agentId>', 'Defendant agent ID')
  .requiredOption('-t, --type <type>', 'Dispute type')
  .requiredOption('--description <desc>', 'Dispute description')
  .action(async (options) => {
    const spinner = ora('Raising dispute...').start();

    try {
      const result = await sdk.disputes.raiseDispute(
        options.contract,
        options.plaintiff,
        options.defendant,
        options.type as DisputeType,
        options.description
      );

      if (result.success && result.data) {
        spinner.succeed('Dispute raised successfully!');
        console.log(chalk.cyan(`  Dispute ID: ${result.data.id}`));
      } else {
        spinner.fail(result.error || 'Failed to raise dispute');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  });

disputeCmd
  .command('list')
  .description('List all disputes')
  .option('-s, --status <status>', 'Filter by status')
  .option('-c, --contract <contractId>', 'Filter by contract')
  .action((options) => {
    const disputes = sdk.disputes.listDisputes({
      status: options.status,
    });

    const filtered = options.contract
      ? disputes.filter(d => d.contractId === options.contract)
      : disputes;

    console.log('\n' + chalk.bold(`Disputes (${filtered.length}):\n`));

    if (filtered.length === 0) {
      console.log(chalk.gray('  No disputes found.'));
      return;
    }

    filtered.forEach((dispute) => {
      console.log(chalk.yellow(`  ${dispute.type}`));
      console.log(chalk.gray(`    ID: ${dispute.id}`));
      console.log(chalk.gray(`    Status: ${dispute.status}`));
      console.log(chalk.gray(`    Contract: ${dispute.contractId}`));
      console.log(chalk.gray(`    Raised: ${dispute.raisedAt.toLocaleDateString()}`));
      console.log('');
    });
  });

// ============================================================================
// Dashboard Command
// ============================================================================

program
  .command('dashboard')
  .description('Show agent dashboard')
  .requiredOption('-a, --agent <agentId>', 'Agent ID')
  .action((options) => {
    const dashboard = sdk.getAgentDashboard(options.agent);

    if (!dashboard.agent) {
      console.log(chalk.red('\n  Agent not found.'));
      return;
    }

    console.log('\n' + chalk.bold.cyan(`Dashboard: ${dashboard.agent.name}\n`));

    console.log(chalk.bold('Contracts:'));
    console.log(chalk.gray(`  Total: ${dashboard.contracts.total}`));
    console.log(chalk.green(`  Active: ${dashboard.contracts.active}`));
    console.log(chalk.blue(`  Completed: ${dashboard.contracts.completed}`));

    console.log('\n' + chalk.bold('Escrow:'));
    console.log(chalk.yellow(`  Held: ${dashboard.escrows.totalHeld} USD`));
    console.log(chalk.green(`  Released: ${dashboard.escrows.totalReleased} USD`));

    console.log('\n' + chalk.bold('Disputes:'));
    console.log(chalk.gray(`  Total: ${dashboard.disputes.total}`));
    console.log(chalk.yellow(`  Open: ${dashboard.disputes.open}`));
    console.log(chalk.blue(`  Resolved: ${dashboard.disputes.resolved}`));

    console.log('');
  });

program.parse();
