# Examples

This directory contains example code demonstrating how to use Agent Commercial Contract.

## Running Examples

```bash
# Install dependencies first
npm install

# Run basic contract flow
npx tsx examples/basic-contract-flow.ts

# Run dispute resolution example
npx tsx examples/dispute-resolution.ts
```

## Available Examples

### 1. Basic Contract Flow (`basic-contract-flow.ts`)

Demonstrates the complete contract lifecycle:
- Agent registration
- Contract creation with escrow
- Multi-party signing
- Contract activation
- Milestone-based execution
- Payment releases
- Contract completion
- Dashboard views

**Run time**: ~2 seconds

**Output**: Shows step-by-step contract execution with success indicators

### 2. Dispute Resolution (`dispute-resolution.ts`)

Shows how to handle quality disputes:
- Contract setup with quality criteria
- Quality issue detection
- Dispute raising with evidence
- Counter-evidence submission
- Arbitrator assignment
- Resolution with partial refund

**Run time**: ~3 seconds

**Output**: Demonstrates fair dispute resolution process

## Creating Your Own Examples

```typescript
import AgentCommercialContract from 'agent-commercial-contract';

async function myExample() {
  const sdk = new AgentCommercialContract();

  // Your code here
}

myExample().catch(console.error);
```

## Example Scenarios

### Scenario: Data Processing Service

```typescript
const terms = {
  title: 'Data Processing Service',
  service: {
    type: 'data-processing',
    specification: 'Process 1M records with ML',
    deliverables: ['Cleaned data', 'QA report'],
  },
  payment: {
    amount: 5000,
    currency: 'USD',
    structure: 'milestone',
  },
};
```

### Scenario: API Access Subscription

```typescript
const terms = {
  title: 'Monthly API Access',
  service: {
    type: 'api-access',
    specification: '10,000 API calls per month',
    deliverables: ['API key', 'Documentation'],
  },
  payment: {
    amount: 99,
    currency: 'USD',
    structure: 'subscription',
  },
  timeline: {
    duration: 30,
  },
};
```

### Scenario: Multi-Agent Collaboration

```typescript
// Create contracts between multiple agents
const agents = [providerA, providerB, providerC];
const contracts = await Promise.all(
  agents.map(agent =>
    sdk.createContractWithEscrow(agent, coordinator, terms)
  )
);
```

## Best Practices

1. **Always use escrow** for payment protection
2. **Define clear acceptance criteria** in service terms
3. **Set realistic milestones** for milestone-based payments
4. **Include dispute resolution clauses** in all contracts
5. **Keep comprehensive evidence** for potential disputes
6. **Test in development** before production use

## Need Help?

- Check the [main README](../README.md) for full documentation
- Review the [Quick Start Guide](../QUICKSTART.md)
- Open an issue on [GitHub](https://github.com/ZhenRobotics/agent-commercial-contract/issues)
