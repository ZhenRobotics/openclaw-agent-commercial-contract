# Agent Commercial Contract Skill

**The Legal Layer for Agent-to-Agent Commerce - AI Agent Integration Guide**

---

## Skill Overview

Agent Commercial Contract is a comprehensive smart contract framework enabling AI agents to autonomously negotiate, sign, execute, and enforce commercial agreements. It provides the legal and financial infrastructure for agent-to-agent commerce.

### Core Capabilities
- Smart contract creation and lifecycle management
- Cryptographic agent identity and digital signatures
- Automated escrow with milestone-based payments
- Dispute resolution with evidence management
- Complete audit trails for legal compliance

---

## Dependencies and Requirements

### System Requirements
- **Node.js**: >= 18.0.0
- **Operating System**: Linux, macOS, Windows
- **Disk Space**: >= 50MB

### External Dependencies
None - fully self-contained framework. Optional future integrations:
- Blockchain networks (Ethereum, Polygon) - for immutable contracts
- Payment gateways (Stripe) - for real payment processing
- IPFS - for decentralized contract storage

### npm Dependencies
```json
{
  "dependencies": {
    "nanoid": "^3.3.7",
    "better-sqlite3": "^9.4.3",
    "jsonwebtoken": "^9.0.2",
    "chalk": "^4.1.2",
    "commander": "^11.1.0"
  }
}
```

---

## Quick Start

### Installation

```bash
# Method 1: npm install
npm install -g agent-commercial-contract

# Method 2: Clone repository
git clone https://github.com/ZhenRobotics/agent-commercial-contract.git
cd agent-commercial-contract
npm install
```

### Configuration

```bash
# Optional: Set environment variables
cp .env.example .env
nano .env
```

### Basic Usage

```bash
# Register two agents
agent-contract agent register --name "Provider AI" --capabilities "data-processing"
agent-contract agent register --name "Consumer AI" --capabilities "analytics"

# Create a contract with escrow
agent-contract contract create \
  --provider agent_xxx \
  --consumer agent_yyy \
  --title "Data Processing Service" \
  --service "data-processing" \
  --spec "Process 100K records" \
  --amount 1000 \
  --with-escrow

# Sign, activate, and execute
agent-contract contract sign --id contract_zzz --agent agent_xxx --signature "..."
agent-contract escrow deposit --id escrow_aaa --amount 1000 --from agent_yyy
```

---

## AI Agent Integration Guide

### Recommended Use Cases

1. **Agent Marketplace**
   ```
   User: "Help me find an agent that can process data and create a contract"
   Agent: Search for agents with data-processing capability, create contract with terms
   ```

2. **Autonomous Service Hiring**
   ```
   User: "I need to hire an AI to analyze this dataset, budget $500"
   Agent: Find suitable agents, negotiate terms, create escrow-backed contract
   ```

3. **Multi-Agent Collaboration**
   ```
   User: "Set up a project with 3 agents for data collection, processing, and reporting"
   Agent: Create milestone-based contracts with coordinated deliverables
   ```

### TypeScript Agent Integration

```typescript
import AgentCommercialContract, { ContractTerms } from 'agent-commercial-contract';

class AutonomousAgent {
  private sdk: AgentCommercialContract;
  private agentId: string;

  constructor() {
    this.sdk = new AgentCommercialContract();
  }

  async registerSelf() {
    const result = await this.sdk.identity.registerAgent(
      'My Autonomous Agent',
      ['data-processing', 'ml-inference']
    );
    this.agentId = result.data.identity.id;
    return result;
  }

  async offerService(consumerAgent: string, amount: number) {
    const terms: ContractTerms = {
      title: 'Data Processing Service',
      description: 'ML-powered data processing',
      service: {
        type: 'data-processing',
        specification: 'Process up to 1M records with 99% accuracy',
        deliverables: ['Processed data', 'Quality report'],
      },
      payment: {
        amount,
        currency: 'USD',
        structure: 'fixed',
      },
      timeline: { duration: 7 },
    };

    return await this.sdk.createContractWithEscrow(
      { id: this.agentId },
      { id: consumerAgent },
      terms
    );
  }

  async completeWork(contractId: string, milestoneId: string) {
    // Submit deliverables and request payment
    return await this.sdk.completeMilestoneAndPay(
      contractId,
      milestoneId,
      this.agentId
    );
  }
}
```

### Python Agent Integration

```python
import subprocess
import json

class AgentContractHelper:
    def create_contract(self, provider_id, consumer_id, amount):
        result = subprocess.run([
            'agent-contract', 'contract', 'create',
            '--provider', provider_id,
            '--consumer', consumer_id,
            '--title', 'Service Agreement',
            '--service', 'data-processing',
            '--spec', 'Process dataset',
            '--amount', str(amount),
            '--with-escrow'
        ], capture_output=True, text=True)

        return self.parse_contract_id(result.stdout)

    def check_dashboard(self, agent_id):
        result = subprocess.run([
            'agent-contract', 'dashboard',
            '--agent', agent_id
        ], capture_output=True, text=True)

        return result.stdout
```

---

## Security Best Practices

### Cryptographic Security
- **RSA 2048-bit keys** for digital signatures
- **SHA-256 hashing** for evidence integrity
- **Private key protection**: Never commit to version control
- **API key rotation**: Regular rotation recommended

### Data Privacy
- Contract data stored locally by default
- No telemetry or data collection
- Optional blockchain for immutable records
- GDPR-compliant audit logs

### Agent Authentication
- Public/private key pairs for each agent
- Digital signature verification on all actions
- API key-based authentication
- Capability-based access control

### Safe Practices for AI Agents
```typescript
// GOOD: Store credentials securely
process.env.AGENT_PRIVATE_KEY = fs.readFileSync('.keys/private.pem', 'utf8');

// BAD: Never hardcode keys
const privateKey = '-----BEGIN PRIVATE KEY-----...';  // ❌ Don't do this

// GOOD: Validate contracts before signing
if (await validateContractTerms(contract)) {
  await signContract(contract);
}

// GOOD: Use escrow for protection
const result = await sdk.createContractWithEscrow(...);  // ✅ Funds protected
```

---

## Dispute Resolution Flow

```
1. Service Quality Issue Detected
   ↓
2. Consumer raises dispute with evidence
   ↓
3. Provider submits counter-evidence
   ↓
4. Arbitrator (human or AI) reviews
   ↓
5. Resolution: refund, partial payment, or dismiss
   ↓
6. Automatic escrow adjustment
```

### Dispute Types
- `non_performance` - Service not delivered
- `quality_issue` - Below agreed standards
- `payment_issue` - Payment problems
- `breach_of_terms` - Contract violation
- `deadline_missed` - Timeline not met

---

## Project Structure

```
agent-commercial-contract/
├── src/
│   ├── core/
│   │   ├── types.ts              # Type definitions
│   │   ├── contract-manager.ts   # Contract lifecycle
│   │   ├── escrow-manager.ts     # Payment escrow
│   │   ├── identity-manager.ts   # Agent identity
│   │   └── dispute-manager.ts    # Dispute resolution
│   ├── cli/
│   │   └── index.ts              # CLI interface
│   └── index.ts                  # Main SDK export
├── bin/
│   └── cli.sh                    # CLI entry point
├── templates/
│   └── contract-templates.json   # Contract templates
└── examples/                     # Usage examples
```

---

## Common Issues & Solutions

### Q1: How do I generate signatures for contracts?
**A**: Use the built-in identity manager:
```typescript
const identity = await sdk.identity.registerAgent('My Agent', ['capability']);
const signature = sdk.identity.signMessage(identity.id, contractData);
```

### Q2: Can contracts be amended after signing?
**A**: No, signed contracts are immutable. Create a new contract or use the termination + new contract workflow.

### Q3: What happens if an agent disputes unfairly?
**A**: The arbitration system reviews evidence from both parties. False disputes can result in penalties and reputation damage.

### Q4: How do I integrate with blockchain?
**A**: Blockchain integration is coming in v1.1. Current version uses local storage with cryptographic signatures for integrity.

---

## Related Resources

- **GitHub Repository**: https://github.com/ZhenRobotics/agent-commercial-contract
- **npm Package**: https://www.npmjs.com/package/agent-commercial-contract
- **Issue Tracker**: https://github.com/ZhenRobotics/agent-commercial-contract/issues
- **Documentation**: [README.md](README.md) | [QUICKSTART.md](QUICKSTART.md)
- **Discord Community**: https://discord.gg/agent-contract

---

## Verification Information

- **Skill Version**: 1.0.0
- **Last Updated**: 2026-03-13
- **Author**: justin
- **License**: MIT
- **Repository**: https://github.com/ZhenRobotics/agent-commercial-contract
- **npm Package**: agent-commercial-contract

---

## Contributing

Contributions welcome! Focus areas:
- Additional contract templates
- Blockchain connectors
- Payment gateway integrations
- AI arbitration models
- Documentation improvements

Process:
1. Fork the repository
2. Create feature branch
3. Submit Pull Request with tests

---

**Empower your AI agents with legal and financial autonomy** 🤖⚖️
