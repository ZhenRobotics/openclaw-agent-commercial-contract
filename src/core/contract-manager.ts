/**
 * Contract Manager - Core contract lifecycle management
 */

import { nanoid } from 'nanoid';
import {
  Contract,
  ContractTerms,
  ContractStatus,
  ContractEvent,
  ContractSignature,
  AgentIdentity,
  CreateContractRequest,
  SignContractRequest,
  OperationResult,
  ContractValidation,
  ValidationError,
  ContractEventType,
} from './types';

export class ContractManager {
  private contracts: Map<string, Contract> = new Map();

  /**
   * Create a new contract
   */
  async createContract(request: CreateContractRequest): Promise<OperationResult<Contract>> {
    try {
      // Validate request
      const validation = this.validateContractTerms(request.terms);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        };
      }

      // Create contract ID
      const contractId = `contract_${nanoid(16)}`;

      // Build contract
      const contract: Contract = {
        id: contractId,
        version: '1.0.0',
        templateId: request.templateId,

        provider: this.normalizeAgentIdentity(request.provider),
        consumer: this.normalizeAgentIdentity(request.consumer),

        terms: request.terms,

        status: 'draft',
        signatures: [],

        createdAt: new Date(),

        events: [
          this.createEvent(contractId, 'created', 'system', 'Contract created'),
        ],
      };

      // Store contract
      this.contracts.set(contractId, contract);

      return {
        success: true,
        data: contract,
        message: `Contract ${contractId} created successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create contract: ${error.message}`,
      };
    }
  }

  /**
   * Sign a contract
   */
  async signContract(request: SignContractRequest): Promise<OperationResult<Contract>> {
    try {
      const contract = this.contracts.get(request.contractId);
      if (!contract) {
        return {
          success: false,
          error: `Contract ${request.contractId} not found`,
        };
      }

      // Check if already signed by this agent
      const alreadySigned = contract.signatures.some(
        sig => sig.agentId === request.agentId
      );
      if (alreadySigned) {
        return {
          success: false,
          error: `Agent ${request.agentId} has already signed this contract`,
        };
      }

      // Determine role
      let role: 'provider' | 'consumer' | 'witness' = 'witness';
      if (request.agentId === contract.provider.id) {
        role = 'provider';
      } else if (request.agentId === contract.consumer.id) {
        role = 'consumer';
      }

      // Add signature
      const signature: ContractSignature = {
        agentId: request.agentId,
        agentName: role === 'provider' ? contract.provider.name : contract.consumer.name,
        role,
        signature: request.signature,
        signedAt: new Date(),
        method: 'ed25519', // Default method
      };

      contract.signatures.push(signature);

      // Update status
      if (contract.status === 'draft') {
        contract.status = 'pending_signature';
      }

      // Check if fully signed
      const providerSigned = contract.signatures.some(
        sig => sig.agentId === contract.provider.id
      );
      const consumerSigned = contract.signatures.some(
        sig => sig.agentId === contract.consumer.id
      );

      if (providerSigned && consumerSigned) {
        contract.status = 'signed';
        contract.signedAt = new Date();

        // Add event
        contract.events.push(
          this.createEvent(
            contract.id,
            'signed',
            request.agentId,
            'Contract fully signed by all parties'
          )
        );
      } else {
        // Add partial signature event
        contract.events.push(
          this.createEvent(
            contract.id,
            'signed',
            request.agentId,
            `Contract signed by ${signature.agentName} (${role})`
          )
        );
      }

      return {
        success: true,
        data: contract,
        message: `Contract signed successfully by ${signature.agentName}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to sign contract: ${error.message}`,
      };
    }
  }

  /**
   * Activate a signed contract
   */
  async activateContract(contractId: string, initiator: string): Promise<OperationResult<Contract>> {
    try {
      const contract = this.contracts.get(contractId);
      if (!contract) {
        return {
          success: false,
          error: `Contract ${contractId} not found`,
        };
      }

      if (contract.status !== 'signed') {
        return {
          success: false,
          error: `Contract must be signed before activation. Current status: ${contract.status}`,
        };
      }

      // Activate contract
      contract.status = 'active';
      contract.activatedAt = new Date();

      contract.events.push(
        this.createEvent(contract.id, 'activated', initiator, 'Contract activated')
      );

      return {
        success: true,
        data: contract,
        message: `Contract ${contractId} activated successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to activate contract: ${error.message}`,
      };
    }
  }

  /**
   * Complete a contract
   */
  async completeContract(contractId: string, initiator: string): Promise<OperationResult<Contract>> {
    try {
      const contract = this.contracts.get(contractId);
      if (!contract) {
        return {
          success: false,
          error: `Contract ${contractId} not found`,
        };
      }

      if (contract.status !== 'active') {
        return {
          success: false,
          error: `Only active contracts can be completed. Current status: ${contract.status}`,
        };
      }

      // Mark as completed
      contract.status = 'completed';
      contract.completedAt = new Date();

      contract.events.push(
        this.createEvent(contract.id, 'completed', initiator, 'Contract completed successfully')
      );

      return {
        success: true,
        data: contract,
        message: `Contract ${contractId} completed successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to complete contract: ${error.message}`,
      };
    }
  }

  /**
   * Terminate a contract
   */
  async terminateContract(
    contractId: string,
    initiator: string,
    reason: string
  ): Promise<OperationResult<Contract>> {
    try {
      const contract = this.contracts.get(contractId);
      if (!contract) {
        return {
          success: false,
          error: `Contract ${contractId} not found`,
        };
      }

      if (contract.status === 'completed' || contract.status === 'terminated') {
        return {
          success: false,
          error: `Contract already ${contract.status}`,
        };
      }

      // Terminate contract
      contract.status = 'terminated';
      contract.terminatedAt = new Date();

      contract.events.push(
        this.createEvent(
          contract.id,
          'terminated',
          initiator,
          `Contract terminated: ${reason}`
        )
      );

      return {
        success: true,
        data: contract,
        message: `Contract ${contractId} terminated`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to terminate contract: ${error.message}`,
      };
    }
  }

  /**
   * Get contract by ID
   */
  getContract(contractId: string): Contract | undefined {
    return this.contracts.get(contractId);
  }

  /**
   * List all contracts
   */
  listContracts(filter?: {
    status?: ContractStatus;
    providerId?: string;
    consumerId?: string;
  }): Contract[] {
    let contracts = Array.from(this.contracts.values());

    if (filter) {
      if (filter.status) {
        contracts = contracts.filter(c => c.status === filter.status);
      }
      if (filter.providerId) {
        contracts = contracts.filter(c => c.provider.id === filter.providerId);
      }
      if (filter.consumerId) {
        contracts = contracts.filter(c => c.consumer.id === filter.consumerId);
      }
    }

    return contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Add event to contract
   */
  addEvent(contractId: string, type: ContractEventType, actorId: string, description: string): void {
    const contract = this.contracts.get(contractId);
    if (contract) {
      contract.events.push(this.createEvent(contractId, type, actorId, description));
    }
  }

  /**
   * Validate contract terms
   */
  private validateContractTerms(terms: ContractTerms): ContractValidation {
    const errors: ValidationError[] = [];

    // Validate title
    if (!terms.title || terms.title.trim().length === 0) {
      errors.push({
        field: 'terms.title',
        message: 'Contract title is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Validate service
    if (!terms.service?.type) {
      errors.push({
        field: 'terms.service.type',
        message: 'Service type is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!terms.service?.specification) {
      errors.push({
        field: 'terms.service.specification',
        message: 'Service specification is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Validate payment
    if (!terms.payment?.amount || terms.payment.amount <= 0) {
      errors.push({
        field: 'terms.payment.amount',
        message: 'Payment amount must be greater than 0',
        code: 'INVALID_VALUE',
      });
    }

    if (!terms.payment?.currency) {
      errors.push({
        field: 'terms.payment.currency',
        message: 'Payment currency is required',
        code: 'REQUIRED_FIELD',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Normalize agent identity (generate ID if missing)
   */
  private normalizeAgentIdentity(agent: Partial<AgentIdentity>): AgentIdentity {
    return {
      id: agent.id || `agent_${nanoid(12)}`,
      name: agent.name || 'Unknown Agent',
      publicKey: agent.publicKey || '',
      endpoint: agent.endpoint,
      capabilities: agent.capabilities || [],
      metadata: agent.metadata || {},
      createdAt: agent.createdAt || new Date(),
      updatedAt: agent.updatedAt || new Date(),
    };
  }

  /**
   * Create a contract event
   */
  private createEvent(
    contractId: string,
    type: ContractEventType,
    actorId: string,
    description: string
  ): ContractEvent {
    return {
      id: `event_${nanoid(12)}`,
      type,
      timestamp: new Date(),
      actorId,
      actorName: actorId === 'system' ? 'System' : actorId,
      description,
    };
  }
}
