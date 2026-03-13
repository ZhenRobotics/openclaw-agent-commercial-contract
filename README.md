# Agent Commercial Contract

**The Legal Layer for Agent-to-Agent Commerce**

A comprehensive smart contract framework for AI agents to autonomously negotiate, sign, execute, and enforce commercial agreements with legal enforceability and automated escrow.

---

## Overview

As AI agents become increasingly autonomous, they need a robust legal and financial infrastructure to conduct commerce with each other. **Agent Commercial Contract** provides:

- **Smart Contract Management** - Create, sign, and execute legally-binding contracts
- **Digital Identity** - Cryptographic agent authentication and signatures
- **Escrow Services** - Automated payment holding and milestone-based release
- **Dispute Resolution** - Built-in arbitration and evidence management
- **Audit Trail** - Complete contract lifecycle event logging

---

## Key Features

### Contract Lifecycle Management
- Create contracts from templates or custom terms
- Multi-party digital signatures with verification
- Automated contract activation and execution
- Milestone-based payment structures
- Contract termination and completion workflows

### Secure Identity System
- Cryptographic key pair generation for each agent
- Public/private key infrastructure for signatures
- API key-based authentication
- Capability-based access control

### Escrow & Payment
- Automated fund holding in escrow accounts
- Milestone-based payment release
- Refund and dispute handling
- Multi-currency support
- Transaction audit trails

### Dispute Resolution
- Structured dispute raising and evidence submission
- Arbitrator assignment and management
- Automated or manual resolution workflows
- Compensation calculation and enforcement

---

## Installation

```bash
# Clone the repository
git clone https://github.com/ZhenRobotics/agent-commercial-contract.git
cd agent-commercial-contract

# Install dependencies
npm install

# Build the project
npm run build

# Run the CLI
npm start
```

Or install globally:

```bash
npm install -g agent-commercial-contract

# Use the CLI
agent-contract --help
acc --help  # Short alias
```

---

## Quick Start

### 1. Register Agents

```bash
# Register provider agent
agent-contract agent register \
  --name "DataProcessor AI" \
  --capabilities "data-processing,machine-learning" \
  --endpoint "https://api.dataprocessor.ai"

# Register consumer agent
agent-contract agent register \
  --name "Analytics Bot" \
  --capabilities "analytics,visualization"
```

### 2. Create a Contract

```bash
agent-contract contract create \
  --provider agent_abc123 \
  --consumer agent_def456 \
  --title "Data Processing Service Agreement" \
  --service "data-processing" \
  --spec "Process 1M records per day with 99.9% accuracy" \
  --amount 5000 \
  --currency USD \
  --with-escrow
```

### 3. Sign the Contract

```bash
# Provider signs
agent-contract contract sign \
  --id contract_xyz789 \
  --agent agent_abc123 \
  --signature <digital_signature>

# Consumer signs
agent-contract contract sign \
  --id contract_xyz789 \
  --agent agent_def456 \
  --signature <digital_signature>
```

### 4. Activate and Execute

```bash
# Activate the contract
agent-contract contract activate --id contract_xyz789

# Deposit funds to escrow
agent-contract escrow deposit \
  --id escrow_abc123 \
  --amount 5000 \
  --from agent_def456

# Upon milestone completion, release payment
agent-contract escrow release \
  --id escrow_abc123 \
  --amount 5000 \
  --reason "Service completed successfully"
```

---

## Usage Examples

### As a Library (SDK)

```typescript
import AgentCommercialContract, { ContractTerms } from 'agent-commercial-contract';

const sdk = new AgentCommercialContract();

// Register agents
const provider = await sdk.identity.registerAgent(
  'DataProcessor AI',
  ['data-processing', 'machine-learning']
);

const consumer = await sdk.identity.registerAgent(
  'Analytics Bot',
  ['analytics']
);

// Create contract with escrow
const terms: ContractTerms = {
  title: 'Data Processing Service',
  description: 'Process customer data with ML models',
  service: {
    type: 'data-processing',
    specification: 'Process 1M records/day, 99.9% accuracy',
    deliverables: ['Processed data', 'Quality report'],
  },
  payment: {
    amount: 5000,
    currency: 'USD',
    structure: 'milestone',
    milestones: [
      {
        id: 'milestone_1',
        name: 'Phase 1: Data ingestion',
        amount: 2000,
        deliverables: ['Data pipeline setup'],
        status: 'pending',
      },
      {
        id: 'milestone_2',
        name: 'Phase 2: Processing',
        amount: 3000,
        deliverables: ['Processed data delivery'],
        status: 'pending',
      },
    ],
  },
  timeline: {
    duration: 30, // days
  },
};

const result = await sdk.createContractWithEscrow(
  provider.data.identity,
  consumer.data.identity,
  terms
);

console.log('Contract created:', result.data.contract.id);
console.log('Escrow created:', result.data.escrow.id);

// Sign and activate
await sdk.signAndActivateContract(
  result.data.contract.id,
  'provider_signature',
  'consumer_signature'
);

// Complete milestone and release payment
await sdk.completeMilestoneAndPay(
  result.data.contract.id,
  'milestone_1',
  provider.data.identity.id
);
```

### Dispute Management

```typescript
// Raise a dispute
const dispute = await sdk.disputes.raiseDispute(
  'contract_xyz789',
  'agent_consumer',
  'agent_provider',
  'quality_issue',
  'Processed data accuracy below 99.9% threshold'
);

// Submit evidence
await sdk.disputes.submitEvidence(
  dispute.data.id,
  'agent_consumer',
  'document',
  'Quality Report',
  'Accuracy measurements showing 97.2%',
  { accuracy: 0.972, expected: 0.999 }
);

// Assign arbitrator
await sdk.disputes.assignArbitrator(
  dispute.data.id,
  'arbitrator_agent_001'
);

// Resolve dispute
await sdk.disputes.resolveDispute(
  dispute.data.id,
  'plaintiff_favor',
  'Quality below agreed threshold, partial refund required',
  'arbitrator_agent_001',
  {
    amount: 2000,
    from: 'agent_provider',
    to: 'agent_consumer',
    reason: 'Partial refund for quality issues',
  }
);
```

---

## CLI Commands

### Agent Management

```bash
# Register new agent
agent-contract agent register -n "My Agent" -c "capability1,capability2"

# List all agents
agent-contract agent list
```

### Contract Management

```bash
# Create contract
agent-contract contract create -p <provider_id> -c <consumer_id> -t "Title" ...

# Sign contract
agent-contract contract sign -i <contract_id> -a <agent_id> -s <signature>

# Activate contract
agent-contract contract activate -i <contract_id>

# List contracts
agent-contract contract list

# Get contract details
agent-contract contract info -i <contract_id>
```

### Escrow Management

```bash
# Deposit funds
agent-contract escrow deposit -i <escrow_id> -a <amount> -f <from_agent>

# Release funds
agent-contract escrow release -i <escrow_id> -a <amount> -r "reason"

# Refund funds
agent-contract escrow refund -i <escrow_id> -a <amount> -r "reason"
```

### Dispute Management

```bash
# Raise dispute
agent-contract dispute raise -c <contract_id> -p <plaintiff> -d <defendant> -t <type> --description "..."

# List disputes
agent-contract dispute list -s <status>
```

### Dashboard

```bash
# View agent dashboard
agent-contract dashboard -a <agent_id>
```

---

## Architecture

```
agent-commercial-contract/
├── src/
│   ├── core/
│   │   ├── types.ts              # Type definitions
│   │   ├── contract-manager.ts   # Contract lifecycle
│   │   ├── escrow-manager.ts     # Payment escrow
│   │   ├── identity-manager.ts   # Agent identity & auth
│   │   └── dispute-manager.ts    # Dispute resolution
│   ├── cli/
│   │   └── index.ts              # CLI interface
│   └── index.ts                  # Main SDK export
├── bin/
│   └── cli.sh                    # CLI entry point
├── tests/
│   ├── test-contract.ts
│   ├── test-escrow.ts
│   └── test-identity.ts
└── templates/
    └── contract-templates.json   # Contract templates
```

### Core Modules

**Contract Manager** - Handles contract creation, signing, activation, and lifecycle events

**Escrow Manager** - Manages payment holding, milestone-based releases, and refunds

**Identity Manager** - Cryptographic identity, key management, and authentication

**Dispute Manager** - Dispute raising, evidence collection, and resolution

---

## Use Cases

### 1. AI Agent Marketplace
- Agents offer services (data processing, API access, computation)
- Automated contract negotiation and signing
- Escrow ensures payment security
- Disputes handled transparently

### 2. Multi-Agent Collaboration
- Multiple agents working on a shared project
- Milestone-based payment releases
- Clear deliverable expectations
- Automated performance verification

### 3. API-as-a-Service between Agents
- Provider agents sell API access
- Consumer agents purchase with smart contracts
- Usage-based or subscription billing
- SLA enforcement via disputes

### 4. Data Exchange Networks
- Agents buy and sell datasets
- Quality guarantees in contracts
- Escrow protects both parties
- Provenance tracking

---

## Security & Legal

### Cryptographic Security
- RSA 2048-bit key pairs for signatures
- SHA-256 hashing for evidence integrity
- API key authentication
- Signature verification on all actions

### Legal Enforceability
- Contracts include jurisdiction clauses
- Digital signatures legally binding in most jurisdictions
- Audit trails for compliance
- Dispute resolution mechanisms

### Best Practices
- Store private keys securely (HSM, secure enclaves)
- Use strong API keys
- Regular key rotation
- Verify all signatures
- Maintain comprehensive audit logs

---

## Roadmap

### v1.1 (Q2 2026)
- [ ] Blockchain integration for immutable contracts
- [ ] Multi-currency crypto support (USDC, ETH)
- [ ] Webhooks for contract events
- [ ] GraphQL API

### v1.2 (Q3 2026)
- [ ] Machine learning-based contract recommendations
- [ ] Automated arbitration using AI judges
- [ ] Smart contract templates marketplace
- [ ] Integration with major payment gateways

### v2.0 (Q4 2026)
- [ ] Decentralized identity (DID)
- [ ] Zero-knowledge proofs for privacy
- [ ] Cross-chain contract execution
- [ ] DAO governance for arbitration

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork the repository
git clone https://github.com/YOUR_USERNAME/agent-commercial-contract.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes and commit
git commit -m "Add amazing feature"

# Push and create a Pull Request
git push origin feature/amazing-feature
```

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Links

- **GitHub**: https://github.com/ZhenRobotics/agent-commercial-contract
- **Documentation**: https://docs.agent-commercial-contract.ai
- **Discord Community**: https://discord.gg/agent-contract
- **Twitter**: @AgentContract

---

## Citation

If you use this project in your research or application, please cite:

```bibtex
@software{agent_commercial_contract,
  title = {Agent Commercial Contract: The Legal Layer for Agent-to-Agent Commerce},
  author = {ZhenRobotics},
  year = {2026},
  url = {https://github.com/ZhenRobotics/agent-commercial-contract}
}
```

---

**Built with AI, for AI. Empowering autonomous commerce.** 🤖⚖️
