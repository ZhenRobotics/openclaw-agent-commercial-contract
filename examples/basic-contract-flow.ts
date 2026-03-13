/**
 * Basic Contract Flow Example
 * Demonstrates complete contract lifecycle from creation to completion
 */

import AgentCommercialContract, { ContractTerms } from '../src/index';

async function main() {
  console.log('Agent Commercial Contract - Basic Flow Example\n');

  // Initialize SDK
  const sdk = new AgentCommercialContract();

  // Step 1: Register Agents
  console.log('Step 1: Registering agents...');
  const providerResult = await sdk.identity.registerAgent(
    'DataProcessor AI',
    ['data-processing', 'ml-inference', 'analytics']
  );

  const consumerResult = await sdk.identity.registerAgent(
    'Analytics Bot',
    ['data-analysis', 'reporting', 'visualization']
  );

  if (!providerResult.success || !consumerResult.success) {
    console.error('Failed to register agents');
    return;
  }

  const provider = providerResult.data!.identity;
  const consumer = consumerResult.data!.identity;

  console.log(`✓ Provider registered: ${provider.name} (${provider.id})`);
  console.log(`✓ Consumer registered: ${consumer.name} (${consumer.id})\n`);

  // Step 2: Create Contract with Escrow
  console.log('Step 2: Creating contract with escrow...');
  const terms: ContractTerms = {
    title: 'Data Processing Service Agreement',
    description: 'Process customer dataset with machine learning models',
    service: {
      type: 'data-processing',
      specification: 'Process 100,000 customer records with 99% accuracy',
      deliverables: [
        'Cleaned and processed dataset',
        'Quality assurance report',
        'Processing pipeline documentation',
      ],
      acceptance_criteria: [
        'Accuracy >= 99%',
        'Processing time <= 24 hours',
        'All required fields populated',
      ],
    },
    payment: {
      amount: 5000,
      currency: 'USD',
      structure: 'milestone',
      milestones: [
        {
          id: 'milestone_1',
          name: 'Data Ingestion & Validation',
          description: 'Set up data pipeline and validate input data',
          amount: 1500,
          percentage: 30,
          deliverables: ['Data pipeline setup', 'Validation report'],
          status: 'pending',
        },
        {
          id: 'milestone_2',
          name: 'Data Processing',
          description: 'Run ML models and process all records',
          amount: 2500,
          percentage: 50,
          deliverables: ['Processed dataset', 'Processing logs'],
          status: 'pending',
        },
        {
          id: 'milestone_3',
          name: 'Quality Assurance & Delivery',
          description: 'QA testing and final delivery',
          amount: 1000,
          percentage: 20,
          deliverables: ['QA report', 'Documentation', 'Final dataset'],
          status: 'pending',
        },
      ],
    },
    timeline: {
      duration: 30,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      milestones: [
        {
          id: 'timeline_1',
          name: 'Phase 1',
          description: 'Complete milestone 1',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          deliverables: ['Data pipeline'],
          status: 'pending',
        },
        {
          id: 'timeline_2',
          name: 'Phase 2',
          description: 'Complete milestone 2',
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          deliverables: ['Processed data'],
          status: 'pending',
        },
        {
          id: 'timeline_3',
          name: 'Phase 3',
          description: 'Complete milestone 3',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          deliverables: ['Final delivery'],
          status: 'pending',
        },
      ],
    },
    jurisdiction: 'United States',
    disputeResolution: {
      method: 'arbitration',
      maxDuration: 30,
    },
    liability: {
      maxLiability: 15000,
      limitationType: 'capped',
    },
    confidentiality: true,
  };

  const contractResult = await sdk.createContractWithEscrow(
    provider,
    consumer,
    terms
  );

  if (!contractResult.success || !contractResult.data) {
    console.error('Failed to create contract:', contractResult.error);
    return;
  }

  const contract = contractResult.data.contract;
  const escrow = contractResult.data.escrow;

  console.log(`✓ Contract created: ${contract.id}`);
  console.log(`✓ Escrow created: ${escrow.id}`);
  console.log(`  Payment: ${terms.payment.amount} ${terms.payment.currency}\n`);

  // Step 3: Sign Contract
  console.log('Step 3: Signing contract...');

  // Generate signatures (in production, use real cryptographic signatures)
  const providerSignature = sdk.identity.signMessage(
    provider.id,
    JSON.stringify(contract)
  );

  const consumerSignature = sdk.identity.signMessage(
    consumer.id,
    JSON.stringify(contract)
  );

  if (!providerSignature || !consumerSignature) {
    console.error('Failed to generate signatures');
    return;
  }

  // Provider signs
  await sdk.contracts.signContract({
    contractId: contract.id,
    agentId: provider.id,
    signature: providerSignature,
    credentials: providerResult.data!.credentials,
  });

  // Consumer signs
  await sdk.contracts.signContract({
    contractId: contract.id,
    agentId: consumer.id,
    signature: consumerSignature,
    credentials: consumerResult.data!.credentials,
  });

  console.log(`✓ Contract signed by ${provider.name}`);
  console.log(`✓ Contract signed by ${consumer.name}\n`);

  // Step 4: Activate Contract
  console.log('Step 4: Activating contract...');
  const activateResult = await sdk.contracts.activateContract(contract.id, 'system');

  if (activateResult.success) {
    console.log('✓ Contract activated\n');
  }

  // Step 5: Fund Escrow
  console.log('Step 5: Funding escrow...');
  const depositResult = await sdk.escrow.deposit(
    escrow.id,
    terms.payment.amount,
    consumer.id
  );

  if (depositResult.success) {
    console.log(`✓ Escrow funded: ${terms.payment.amount} ${terms.payment.currency}\n`);
  }

  // Step 6: Complete Milestone 1 and Release Payment
  console.log('Step 6: Completing first milestone...');
  const milestone1Result = await sdk.completeMilestoneAndPay(
    contract.id,
    'milestone_1',
    provider.id
  );

  if (milestone1Result.success) {
    console.log('✓ Milestone 1 completed');
    console.log(`✓ Payment released: 1500 USD`);
    console.log(`  Escrow balance: ${milestone1Result.data?.escrow.balance} USD\n`);
  }

  // Step 7: Complete Milestone 2
  console.log('Step 7: Completing second milestone...');
  const milestone2Result = await sdk.completeMilestoneAndPay(
    contract.id,
    'milestone_2',
    provider.id
  );

  if (milestone2Result.success) {
    console.log('✓ Milestone 2 completed');
    console.log(`✓ Payment released: 2500 USD`);
    console.log(`  Escrow balance: ${milestone2Result.data?.escrow.balance} USD\n`);
  }

  // Step 8: Complete Final Milestone and Contract
  console.log('Step 8: Completing final milestone...');
  const milestone3Result = await sdk.completeMilestoneAndPay(
    contract.id,
    'milestone_3',
    provider.id
  );

  if (milestone3Result.success) {
    console.log('✓ Milestone 3 completed');
    console.log(`✓ Payment released: 1000 USD`);
    console.log(`  Escrow balance: ${milestone3Result.data?.escrow.balance} USD\n`);
  }

  // Step 9: Complete Contract
  console.log('Step 9: Completing contract...');
  const completeResult = await sdk.contracts.completeContract(contract.id, provider.id);

  if (completeResult.success) {
    console.log('✓ Contract completed successfully!\n');
  }

  // Step 10: View Dashboard
  console.log('Step 10: Provider Dashboard');
  console.log('─'.repeat(50));
  const providerDashboard = sdk.getAgentDashboard(provider.id);
  console.log(`Agent: ${providerDashboard.agent?.name}`);
  console.log(`Contracts: ${providerDashboard.contracts.total} total, ${providerDashboard.contracts.completed} completed`);
  console.log(`Earnings: ${providerDashboard.escrows.totalReleased} USD`);
  console.log('');

  console.log('Consumer Dashboard');
  console.log('─'.repeat(50));
  const consumerDashboard = sdk.getAgentDashboard(consumer.id);
  console.log(`Agent: ${consumerDashboard.agent?.name}`);
  console.log(`Contracts: ${consumerDashboard.contracts.total} total, ${consumerDashboard.contracts.completed} completed`);
  console.log(`Spent: ${consumerDashboard.escrows.totalHeld} USD held, ${consumerDashboard.escrows.totalReleased} USD released`);
  console.log('');

  console.log('🎉 Example completed successfully!');
}

// Run example
main().catch(console.error);
