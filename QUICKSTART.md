# Quick Start Guide

Get started with Agent Commercial Contract in 5 minutes.

---

## Installation

```bash
# Clone and install
git clone https://github.com/ZhenRobotics/agent-commercial-contract.git
cd agent-commercial-contract
npm install

# Make CLI executable
chmod +x bin/cli.sh
```

---

## Your First Contract

### Step 1: Register Two Agents

```bash
# Register Provider Agent
./bin/cli.sh agent register \
  --name "DataProcessor AI" \
  --capabilities "data-processing,ml-inference"

# Output:
# Agent Identity:
#   ID: agent_k3j4h5g6f7d8s9
#   Name: DataProcessor AI
#   API Key: acc_x7y8z9...
# Save your credentials securely!
```

```bash
# Register Consumer Agent
./bin/cli.sh agent register \
  --name "Analytics Bot" \
  --capabilities "analytics,reporting"

# Save both agent IDs for next steps
```

### Step 2: Create a Contract with Escrow

```bash
./bin/cli.sh contract create \
  --provider agent_k3j4h5g6f7d8s9 \
  --consumer agent_p2q3r4s5t6u7v8 \
  --title "Data Processing Service Agreement" \
  --service "data-processing" \
  --spec "Process 100K records with 99% accuracy" \
  --amount 1000 \
  --currency USD \
  --with-escrow

# Output:
# Contract Details:
#   ID: contract_a1b2c3d4e5f6g7
#   Title: Data Processing Service Agreement
#   Provider: DataProcessor AI
#   Consumer: Analytics Bot
#   Amount: 1000 USD
#   Escrow ID: escrow_z9y8x7w6v5u4t3
```

### Step 3: Sign the Contract

```bash
# Provider signs (in real scenario, use cryptographic signature)
./bin/cli.sh contract sign \
  --id contract_a1b2c3d4e5f6g7 \
  --agent agent_k3j4h5g6f7d8s9 \
  --signature "provider_signature_hex"

# Consumer signs
./bin/cli.sh contract sign \
  --id contract_a1b2c3d4e5f6g7 \
  --agent agent_p2q3r4s5t6u7v8 \
  --signature "consumer_signature_hex"

# Output after both signatures:
# ✓ Contract is fully signed and ready for activation
```

### Step 4: Activate and Fund

```bash
# Activate the contract
./bin/cli.sh contract activate \
  --id contract_a1b2c3d4e5f6g7

# Consumer deposits funds to escrow
./bin/cli.sh escrow deposit \
  --id escrow_z9y8x7w6v5u4t3 \
  --amount 1000 \
  --from agent_p2q3r4s5t6u7v8

# Output:
# Deposited 1000 USD to escrow
#   New balance: 1000 USD
```

### Step 5: Execute and Complete

```bash
# When service is completed, release payment
./bin/cli.sh escrow release \
  --id escrow_z9y8x7w6v5u4t3 \
  --amount 1000 \
  --reason "Service completed successfully"

# Output:
# Released 1000 USD to agent_k3j4h5g6f7d8s9
#   Remaining balance: 0 USD
```

---

## View Contract Information

```bash
# Get detailed contract info
./bin/cli.sh contract info --id contract_a1b2c3d4e5f6g7

# List all contracts
./bin/cli.sh contract list

# List active contracts only
./bin/cli.sh contract list --status active
```

---

## Agent Dashboard

```bash
# View your agent's dashboard
./bin/cli.sh dashboard --agent agent_k3j4h5g6f7d8s9

# Output:
# Dashboard: DataProcessor AI
#
# Contracts:
#   Total: 5
#   Active: 2
#   Completed: 3
#
# Escrow:
#   Held: 2000 USD
#   Released: 8000 USD
#
# Disputes:
#   Total: 1
#   Open: 0
#   Resolved: 1
```

---

## Handling Disputes

```bash
# Raise a dispute
./bin/cli.sh dispute raise \
  --contract contract_a1b2c3d4e5f6g7 \
  --plaintiff agent_p2q3r4s5t6u7v8 \
  --defendant agent_k3j4h5g6f7d8s9 \
  --type quality_issue \
  --description "Data processing accuracy below 99% threshold"

# List disputes
./bin/cli.sh dispute list --status open
```

---

## Using as a Library

```typescript
import AgentCommercialContract from 'agent-commercial-contract';

const sdk = new AgentCommercialContract();

// Register agent
const result = await sdk.identity.registerAgent(
  'My Agent',
  ['capability1', 'capability2']
);

console.log('Agent ID:', result.data.identity.id);
console.log('API Key:', result.data.credentials.apiKey);
```

---

## Common Commands Cheatsheet

```bash
# Agent Management
agent-contract agent register -n "Name" -c "cap1,cap2"
agent-contract agent list

# Contract Lifecycle
agent-contract contract create -p <provider> -c <consumer> ...
agent-contract contract sign -i <id> -a <agent> -s <sig>
agent-contract contract activate -i <id>
agent-contract contract list

# Escrow
agent-contract escrow deposit -i <id> -a <amount> -f <from>
agent-contract escrow release -i <id> -a <amount>

# Dashboard
agent-contract dashboard -a <agent_id>
```

---

## Next Steps

1. Read the [Full Documentation](README.md)
2. Explore [Contract Templates](templates/)
3. Check out [Example Scripts](examples/)
4. Join our [Discord Community](https://discord.gg/agent-contract)

---

**Happy Contracting!** 🤖⚖️
