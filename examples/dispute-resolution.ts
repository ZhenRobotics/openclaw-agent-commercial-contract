/**
 * Dispute Resolution Example
 * Demonstrates how to handle disputes in agent contracts
 */

import AgentCommercialContract from '../src/index';

async function main() {
  console.log('Agent Commercial Contract - Dispute Resolution Example\n');

  const sdk = new AgentCommercialContract();

  // Step 1: Setup - Register agents and create contract
  console.log('Step 1: Setting up contract...');
  const provider = await sdk.identity.registerAgent('Provider Agent', ['service']);
  const consumer = await sdk.identity.registerAgent('Consumer Agent', ['consumer']);

  const contractResult = await sdk.createContractWithEscrow(
    provider.data!.identity,
    consumer.data!.identity,
    {
      title: 'Service with Quality Guarantee',
      description: 'Service must meet 99% accuracy threshold',
      service: {
        type: 'data-processing',
        specification: 'Process data with 99% accuracy',
        deliverables: ['Processed data'],
        acceptance_criteria: ['Accuracy >= 99%'],
      },
      payment: {
        amount: 1000,
        currency: 'USD',
        structure: 'fixed',
      },
      timeline: {
        duration: 7,
      },
    }
  );

  const contract = contractResult.data!.contract;
  console.log(`✓ Contract created: ${contract.id}\n`);

  // Step 2: Simulate quality issue
  console.log('Step 2: Service delivered but quality below threshold...');
  console.log('  Expected: 99% accuracy');
  console.log('  Actual: 95% accuracy\n');

  // Step 3: Consumer raises dispute
  console.log('Step 3: Consumer raising dispute...');
  const disputeResult = await sdk.disputes.raiseDispute(
    contract.id,
    consumer.data!.identity.id,
    provider.data!.identity.id,
    'quality_issue',
    'Service quality below agreed 99% accuracy threshold. Actual accuracy is 95%.'
  );

  if (!disputeResult.success || !disputeResult.data) {
    console.error('Failed to raise dispute');
    return;
  }

  const dispute = disputeResult.data;
  console.log(`✓ Dispute raised: ${dispute.id}`);
  console.log(`  Type: ${dispute.type}`);
  console.log(`  Status: ${dispute.status}\n`);

  // Step 4: Consumer submits evidence
  console.log('Step 4: Consumer submitting evidence...');
  await sdk.disputes.submitEvidence(
    dispute.id,
    consumer.data!.identity.id,
    'document',
    'Quality Assurance Report',
    'Independent QA testing showing 95% accuracy across test dataset',
    {
      testSamples: 1000,
      correctResults: 950,
      accuracy: 0.95,
      expectedAccuracy: 0.99,
      methodology: 'Random sampling with ground truth verification',
    }
  );

  console.log('✓ Evidence submitted: QA Report\n');

  // Step 5: Provider submits counter-evidence
  console.log('Step 5: Provider submitting counter-evidence...');
  await sdk.disputes.submitEvidence(
    dispute.id,
    provider.data!.identity.id,
    'api_log',
    'Processing Logs',
    'Internal testing showed 98.5% accuracy. May be due to data quality issues.',
    {
      internalAccuracy: 0.985,
      processingTime: '22 hours',
      recordsProcessed: 100000,
      note: 'Data quality issues in source dataset may have affected results',
    }
  );

  console.log('✓ Counter-evidence submitted: Processing Logs\n');

  // Step 6: Assign arbitrator
  console.log('Step 6: Assigning arbitrator...');
  const arbitrator = await sdk.identity.registerAgent(
    'Neutral Arbitrator AI',
    ['arbitration', 'dispute-resolution']
  );

  await sdk.disputes.assignArbitrator(dispute.id, arbitrator.data!.identity.id);
  console.log(`✓ Arbitrator assigned: ${arbitrator.data!.identity.name}\n`);

  // Step 7: Arbitrator reviews evidence
  console.log('Step 7: Arbitrator reviewing evidence...');
  console.log('  Reviewing consumer evidence...');
  console.log('  Reviewing provider evidence...');
  console.log('  Analyzing contract terms...\n');

  // Simulate arbitrator decision-making
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Step 8: Resolve dispute
  console.log('Step 8: Arbitrator issuing ruling...');
  const resolutionResult = await sdk.disputes.resolveDispute(
    dispute.id,
    'partial',
    `Based on the evidence provided:

1. Consumer's QA report shows 95% accuracy (independent testing)
2. Provider's internal testing showed 98.5% accuracy
3. Contract specified 99% accuracy threshold

Ruling: The service did not meet the contracted 99% accuracy threshold.
However, the discrepancy between internal and external testing suggests
data quality issues may have been a contributing factor.

Resolution: Partial refund of 40% (400 USD) to consumer, 60% (600 USD)
to provider for work performed.`,
    arbitrator.data!.identity.id,
    {
      amount: 400,
      from: provider.data!.identity.id,
      to: consumer.data!.identity.id,
      reason: 'Partial refund for quality below threshold',
    }
  );

  if (resolutionResult.success) {
    console.log('✓ Dispute resolved');
    console.log(`  Outcome: ${resolutionResult.data!.resolution!.outcome}`);
    console.log(`  Compensation: 400 USD refund to consumer\n`);
  }

  // Step 9: Summary
  console.log('Step 9: Dispute Summary');
  console.log('─'.repeat(50));
  const finalDispute = sdk.disputes.getDispute(dispute.id);
  if (finalDispute) {
    console.log(`Status: ${finalDispute.status}`);
    console.log(`Evidence submitted: ${finalDispute.evidence.length} items`);
    console.log(`Resolved by: ${finalDispute.resolution?.decidedBy}`);
    console.log(`Resolution time: ${
      Math.round(
        (finalDispute.resolvedAt!.getTime() - finalDispute.raisedAt.getTime()) /
          (1000 * 60)
      )
    } minutes`);
  }

  console.log('\n🎉 Dispute resolution example completed!');
  console.log('\nKey Takeaways:');
  console.log('  - Clear contract terms enable fair dispute resolution');
  console.log('  - Evidence submission is crucial for both parties');
  console.log('  - Neutral arbitration provides balanced outcomes');
  console.log('  - Automated compensation ensures quick resolution');
}

main().catch(console.error);
