/**
 * Agent Commercial Contract - Core Type Definitions
 * The Legal Layer for Agent-to-Agent Commerce
 */

// ============================================================================
// Agent Identity & Authentication
// ============================================================================

export interface AgentIdentity {
  id: string;                    // Unique agent identifier
  name: string;                  // Agent display name
  publicKey: string;             // Public key for signature verification
  endpoint?: string;             // Agent API endpoint
  capabilities?: string[];       // List of agent capabilities
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentCredentials {
  agentId: string;
  privateKey: string;            // Private key for signing (stored securely)
  apiKey?: string;               // Optional API key for authentication
}

// ============================================================================
// Contract Structure
// ============================================================================

export interface Contract {
  id: string;                    // Unique contract ID
  version: string;               // Contract version (e.g., "1.0.0")
  templateId?: string;           // Template used (if any)

  // Parties
  provider: AgentIdentity;       // Service provider agent
  consumer: AgentIdentity;       // Service consumer agent

  // Terms
  terms: ContractTerms;

  // Status & Lifecycle
  status: ContractStatus;
  signatures: ContractSignature[];

  // Timestamps
  createdAt: Date;
  signedAt?: Date;
  activatedAt?: Date;
  completedAt?: Date;
  terminatedAt?: Date;

  // Audit
  events: ContractEvent[];
  metadata?: Record<string, any>;
}

export interface ContractTerms {
  title: string;
  description: string;

  // Service Definition
  service: {
    type: string;                // e.g., "data-processing", "api-access", "computation"
    specification: string;       // Detailed service description
    deliverables: string[];
    acceptance_criteria?: string[];
  };

  // Payment Terms
  payment: {
    amount: number;
    currency: string;            // e.g., "USD", "EUR", "USDC"
    structure: 'fixed' | 'milestone' | 'hourly' | 'subscription';
    milestones?: PaymentMilestone[];
    dueDate?: Date;
  };

  // Timeline
  timeline: {
    startDate?: Date;
    endDate?: Date;
    duration?: number;           // Duration in days
    milestones?: TimelineMilestone[];
  };

  // Legal & Compliance
  jurisdiction?: string;
  disputeResolution?: DisputeResolutionClause;
  liability?: LiabilityClause;
  confidentiality?: boolean;

  // Special Conditions
  conditions?: string[];
  customTerms?: Record<string, any>;
}

export interface PaymentMilestone {
  id: string;
  name: string;
  description: string;
  amount: number;
  percentage?: number;           // Percentage of total
  dueDate?: Date;
  deliverables: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'paid';
  completedAt?: Date;
  paidAt?: Date;
}

export interface TimelineMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  deliverables: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: Date;
}

export interface DisputeResolutionClause {
  method: 'arbitration' | 'mediation' | 'automated' | 'court';
  arbitrator?: string;           // Third-party arbitrator agent ID
  rules?: string;
  maxDuration?: number;          // Max duration in days
}

export interface LiabilityClause {
  maxLiability?: number;
  limitationType: 'capped' | 'unlimited' | 'proportional';
  exclusions?: string[];
}

// ============================================================================
// Contract Status & Lifecycle
// ============================================================================

export type ContractStatus =
  | 'draft'                      // Being drafted
  | 'pending_signature'          // Awaiting signatures
  | 'signed'                     // Fully signed, not yet active
  | 'active'                     // Currently executing
  | 'completed'                  // Successfully completed
  | 'terminated'                 // Terminated early
  | 'disputed'                   // Under dispute
  | 'expired'                    // Expired without completion
  | 'cancelled';                 // Cancelled before signing

export interface ContractSignature {
  agentId: string;
  agentName: string;
  role: 'provider' | 'consumer' | 'witness';
  signature: string;             // Digital signature
  signedAt: Date;
  ipAddress?: string;
  method: 'ed25519' | 'rsa' | 'ecdsa';
}

export interface ContractEvent {
  id: string;
  type: ContractEventType;
  timestamp: Date;
  actorId: string;               // Agent who triggered the event
  actorName: string;
  description: string;
  data?: Record<string, any>;
}

export type ContractEventType =
  | 'created'
  | 'updated'
  | 'signed'
  | 'activated'
  | 'milestone_completed'
  | 'payment_made'
  | 'payment_received'
  | 'dispute_raised'
  | 'dispute_resolved'
  | 'completed'
  | 'terminated'
  | 'expired';

// ============================================================================
// Escrow & Payment
// ============================================================================

export interface EscrowAccount {
  id: string;
  contractId: string;

  // Balance
  balance: number;
  currency: string;

  // Parties
  payer: string;                 // Consumer agent ID
  payee: string;                 // Provider agent ID

  // Status
  status: EscrowStatus;

  // Transactions
  transactions: EscrowTransaction[];

  // Release conditions
  releaseConditions?: ReleaseCondition[];
  autoRelease?: boolean;
  releaseDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type EscrowStatus =
  | 'pending'                    // Awaiting funding
  | 'funded'                     // Fully funded
  | 'partially_released'         // Some funds released
  | 'released'                   // All funds released to payee
  | 'refunded'                   // Funds returned to payer
  | 'disputed'                   // Under dispute
  | 'expired';                   // Expired without release

export interface EscrowTransaction {
  id: string;
  type: 'deposit' | 'release' | 'refund' | 'fee';
  amount: number;
  from: string;                  // Agent ID
  to: string;                    // Agent ID
  reason?: string;
  milestoneId?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;      // For blockchain transactions
}

export interface ReleaseCondition {
  id: string;
  type: 'milestone' | 'time' | 'approval' | 'oracle';
  description: string;
  status: 'pending' | 'met' | 'failed';
  verifier?: string;             // Who verifies this condition
  verifiedAt?: Date;
  data?: Record<string, any>;
}

// ============================================================================
// Dispute Resolution
// ============================================================================

export interface Dispute {
  id: string;
  contractId: string;

  // Parties
  plaintiff: string;             // Agent ID who raised dispute
  defendant: string;             // Other party
  arbitrator?: string;           // Assigned arbitrator agent ID

  // Details
  type: DisputeType;
  description: string;
  evidence: Evidence[];

  // Status
  status: DisputeStatus;
  resolution?: DisputeResolution;

  // Timeline
  raisedAt: Date;
  resolvedAt?: Date;
  deadline?: Date;
}

export type DisputeType =
  | 'non_performance'            // Service not delivered
  | 'quality_issue'              // Quality below standards
  | 'payment_issue'              // Payment not received/incorrect
  | 'breach_of_terms'            // Contract terms violated
  | 'deadline_missed'            // Timeline not met
  | 'other';

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'awaiting_evidence'
  | 'in_arbitration'
  | 'resolved'
  | 'escalated'
  | 'withdrawn';

export interface Evidence {
  id: string;
  submittedBy: string;           // Agent ID
  type: 'document' | 'message' | 'transaction' | 'api_log' | 'other';
  title: string;
  description: string;
  data: string | Record<string, any>;
  submittedAt: Date;
  hash?: string;                 // Content hash for verification
}

export interface DisputeResolution {
  outcome: 'plaintiff_favor' | 'defendant_favor' | 'partial' | 'dismissed';
  ruling: string;
  compensation?: {
    amount: number;
    from: string;
    to: string;
    reason: string;
  };
  decidedBy: string;             // Arbitrator agent ID
  decidedAt: Date;
}

// ============================================================================
// Contract Templates
// ============================================================================

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;

  // Template structure
  termsTemplate: Partial<ContractTerms>;
  requiredFields: string[];
  optionalFields: string[];

  // Validation
  validation?: ValidationRule[];

  metadata: {
    author: string;
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    tags: string[];
  };
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

// ============================================================================
// API & Operations
// ============================================================================

export interface CreateContractRequest {
  templateId?: string;
  provider: Partial<AgentIdentity>;
  consumer: Partial<AgentIdentity>;
  terms: ContractTerms;
  autoSign?: boolean;
}

export interface SignContractRequest {
  contractId: string;
  agentId: string;
  signature: string;
  credentials: AgentCredentials;
}

export interface ExecuteContractRequest {
  contractId: string;
  initiator: string;
}

export interface UpdateMilestoneRequest {
  contractId: string;
  milestoneId: string;
  status: 'completed' | 'in_progress';
  evidence?: Evidence[];
}

export interface RaiseDisputeRequest {
  contractId: string;
  plaintiff: string;
  type: DisputeType;
  description: string;
  evidence?: Evidence[];
}

// ============================================================================
// Utilities
// ============================================================================

export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ContractValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}
