/**
 * Agent Commercial Contract SDK
 * The Legal Layer for Agent-to-Agent Commerce
 *
 * Main entry point for the SDK
 */

import { ContractManager } from './core/contract-manager';
import { EscrowManager } from './core/escrow-manager';
import { IdentityManager } from './core/identity-manager';
import { DisputeManager } from './core/dispute-manager';
import {
  Contract,
  ContractTerms,
  AgentIdentity,
  EscrowAccount,
  Dispute,
  CreateContractRequest,
  OperationResult,
} from './core/types';

export class AgentCommercialContract {
  public contracts: ContractManager;
  public escrow: EscrowManager;
  public identity: IdentityManager;
  public disputes: DisputeManager;

  constructor() {
    this.contracts = new ContractManager();
    this.escrow = new EscrowManager();
    this.identity = new IdentityManager();
    this.disputes = new DisputeManager();
  }

  /**
   * Complete workflow: Create contract with escrow
   */
  async createContractWithEscrow(
    provider: Partial<AgentIdentity>,
    consumer: Partial<AgentIdentity>,
    terms: ContractTerms
  ): Promise<OperationResult<{ contract: Contract; escrow: EscrowAccount }>> {
    try {
      // Create contract
      const contractResult = await this.contracts.createContract({
        provider,
        consumer,
        terms,
      });

      if (!contractResult.success || !contractResult.data) {
        return {
          success: false,
          error: contractResult.error,
        };
      }

      const contract = contractResult.data;

      // Create escrow account
      const escrowResult = await this.escrow.createEscrow(
        contract.id,
        contract.consumer.id,
        contract.provider.id,
        terms.payment.amount,
        terms.payment.currency
      );

      if (!escrowResult.success || !escrowResult.data) {
        return {
          success: false,
          error: `Contract created but escrow failed: ${escrowResult.error}`,
        };
      }

      return {
        success: true,
        data: {
          contract,
          escrow: escrowResult.data,
        },
        message: 'Contract and escrow created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create contract with escrow: ${error.message}`,
      };
    }
  }

  /**
   * Complete workflow: Sign and activate contract
   */
  async signAndActivateContract(
    contractId: string,
    providerSignature: string,
    consumerSignature: string
  ): Promise<OperationResult<Contract>> {
    try {
      const contract = this.contracts.getContract(contractId);
      if (!contract) {
        return {
          success: false,
          error: `Contract ${contractId} not found`,
        };
      }

      // Sign by provider
      const providerSignResult = await this.contracts.signContract({
        contractId,
        agentId: contract.provider.id,
        signature: providerSignature,
        credentials: {} as any, // Would need real credentials in production
      });

      if (!providerSignResult.success) {
        return providerSignResult;
      }

      // Sign by consumer
      const consumerSignResult = await this.contracts.signContract({
        contractId,
        agentId: contract.consumer.id,
        signature: consumerSignature,
        credentials: {} as any,
      });

      if (!consumerSignResult.success) {
        return consumerSignResult;
      }

      // Activate contract
      return await this.contracts.activateContract(contractId, 'system');
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to sign and activate contract: ${error.message}`,
      };
    }
  }

  /**
   * Complete workflow: Complete milestone and release payment
   */
  async completeMilestoneAndPay(
    contractId: string,
    milestoneId: string,
    completedBy: string
  ): Promise<OperationResult<{ contract: Contract; escrow: EscrowAccount }>> {
    try {
      const contract = this.contracts.getContract(contractId);
      if (!contract) {
        return {
          success: false,
          error: `Contract ${contractId} not found`,
        };
      }

      // Find and mark milestone as completed
      const milestone = contract.terms.payment.milestones?.find(
        m => m.id === milestoneId
      );

      if (!milestone) {
        return {
          success: false,
          error: `Milestone ${milestoneId} not found`,
        };
      }

      milestone.status = 'completed';
      milestone.completedAt = new Date();

      // Add event
      this.contracts.addEvent(
        contractId,
        'milestone_completed',
        completedBy,
        `Milestone completed: ${milestone.name}`
      );

      // Release payment from escrow
      const escrowResult = await this.escrow.releaseForMilestone(
        contractId,
        milestoneId,
        contract
      );

      if (!escrowResult.success) {
        return {
          success: false,
          error: `Milestone marked but payment release failed: ${escrowResult.error}`,
        };
      }

      // Mark milestone as paid
      milestone.status = 'paid';
      milestone.paidAt = new Date();

      return {
        success: true,
        data: {
          contract,
          escrow: escrowResult.data!,
        },
        message: `Milestone completed and payment released: ${milestone.amount} ${contract.terms.payment.currency}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to complete milestone and pay: ${error.message}`,
      };
    }
  }

  /**
   * Get complete contract information with escrow and disputes
   */
  getCompleteContractInfo(contractId: string): {
    contract?: Contract;
    escrow?: EscrowAccount;
    disputes: Dispute[];
  } {
    return {
      contract: this.contracts.getContract(contractId),
      escrow: this.escrow.findEscrowByContract(contractId),
      disputes: this.disputes.findDisputesByContract(contractId),
    };
  }

  /**
   * Get agent dashboard data
   */
  getAgentDashboard(agentId: string): {
    agent?: AgentIdentity;
    contracts: {
      asProvider: Contract[];
      asConsumer: Contract[];
      total: number;
      active: number;
      completed: number;
    };
    escrows: {
      asPayer: EscrowAccount[];
      asPayee: EscrowAccount[];
      totalHeld: number;
      totalReleased: number;
    };
    disputes: {
      asPlaintiff: Dispute[];
      asDefendant: Dispute[];
      total: number;
      open: number;
      resolved: number;
    };
  } {
    const agent = this.identity.getAgent(agentId);

    // Contracts
    const asProvider = this.contracts.listContracts({ providerId: agentId });
    const asConsumer = this.contracts.listContracts({ consumerId: agentId });
    const allContracts = [...asProvider, ...asConsumer];

    // Escrows
    const asPayer = this.escrow.listEscrows({ payer: agentId });
    const asPayee = this.escrow.listEscrows({ payee: agentId });
    const totalHeld = asPayer.reduce((sum, e) => sum + e.balance, 0);
    const totalReleased = asPayee.reduce(
      (sum, e) => sum + this.escrow.getTotalReleased(e.id),
      0
    );

    // Disputes
    const asPlaintiff = this.disputes.listDisputes({ plaintiff: agentId });
    const asDefendant = this.disputes.listDisputes({ defendant: agentId });
    const allDisputes = [...asPlaintiff, ...asDefendant];

    return {
      agent,
      contracts: {
        asProvider,
        asConsumer,
        total: allContracts.length,
        active: allContracts.filter(c => c.status === 'active').length,
        completed: allContracts.filter(c => c.status === 'completed').length,
      },
      escrows: {
        asPayer,
        asPayee,
        totalHeld,
        totalReleased,
      },
      disputes: {
        asPlaintiff,
        asDefendant,
        total: allDisputes.length,
        open: allDisputes.filter(d => d.status === 'open').length,
        resolved: allDisputes.filter(d => d.status === 'resolved').length,
      },
    };
  }
}

// Export types
export * from './core/types';
export { ContractManager } from './core/contract-manager';
export { EscrowManager } from './core/escrow-manager';
export { IdentityManager } from './core/identity-manager';
export { DisputeManager } from './core/dispute-manager';

// Default export
export default AgentCommercialContract;
