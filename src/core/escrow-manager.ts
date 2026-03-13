/**
 * Escrow Manager - Payment escrow and milestone-based release
 */

import { nanoid } from 'nanoid';
import {
  EscrowAccount,
  EscrowStatus,
  EscrowTransaction,
  ReleaseCondition,
  OperationResult,
  Contract,
} from './types';

export class EscrowManager {
  private escrows: Map<string, EscrowAccount> = new Map();

  /**
   * Create escrow account for a contract
   */
  async createEscrow(
    contractId: string,
    payer: string,
    payee: string,
    amount: number,
    currency: string
  ): Promise<OperationResult<EscrowAccount>> {
    try {
      if (amount <= 0) {
        return {
          success: false,
          error: 'Escrow amount must be greater than 0',
        };
      }

      const escrowId = `escrow_${nanoid(16)}`;

      const escrow: EscrowAccount = {
        id: escrowId,
        contractId,
        balance: 0, // Initially unfunded
        currency,
        payer,
        payee,
        status: 'pending',
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.escrows.set(escrowId, escrow);

      return {
        success: true,
        data: escrow,
        message: `Escrow account ${escrowId} created`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create escrow: ${error.message}`,
      };
    }
  }

  /**
   * Deposit funds into escrow
   */
  async deposit(
    escrowId: string,
    amount: number,
    from: string
  ): Promise<OperationResult<EscrowAccount>> {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        return {
          success: false,
          error: `Escrow ${escrowId} not found`,
        };
      }

      if (escrow.status !== 'pending' && escrow.status !== 'funded') {
        return {
          success: false,
          error: `Cannot deposit to escrow with status: ${escrow.status}`,
        };
      }

      if (amount <= 0) {
        return {
          success: false,
          error: 'Deposit amount must be greater than 0',
        };
      }

      // Create deposit transaction
      const transaction: EscrowTransaction = {
        id: `tx_${nanoid(12)}`,
        type: 'deposit',
        amount,
        from,
        to: escrowId,
        timestamp: new Date(),
        status: 'completed',
      };

      // Update balance
      escrow.balance += amount;
      escrow.transactions.push(transaction);
      escrow.status = 'funded';
      escrow.updatedAt = new Date();

      return {
        success: true,
        data: escrow,
        message: `Deposited ${amount} ${escrow.currency} to escrow ${escrowId}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to deposit: ${error.message}`,
      };
    }
  }

  /**
   * Release funds to payee
   */
  async release(
    escrowId: string,
    amount: number,
    reason?: string,
    milestoneId?: string
  ): Promise<OperationResult<EscrowAccount>> {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        return {
          success: false,
          error: `Escrow ${escrowId} not found`,
        };
      }

      if (escrow.status !== 'funded' && escrow.status !== 'partially_released') {
        return {
          success: false,
          error: `Cannot release from escrow with status: ${escrow.status}`,
        };
      }

      if (amount <= 0 || amount > escrow.balance) {
        return {
          success: false,
          error: `Invalid release amount. Available balance: ${escrow.balance}`,
        };
      }

      // Create release transaction
      const transaction: EscrowTransaction = {
        id: `tx_${nanoid(12)}`,
        type: 'release',
        amount,
        from: escrowId,
        to: escrow.payee,
        reason,
        milestoneId,
        timestamp: new Date(),
        status: 'completed',
      };

      // Update balance
      escrow.balance -= amount;
      escrow.transactions.push(transaction);

      // Update status
      if (escrow.balance === 0) {
        escrow.status = 'released';
      } else {
        escrow.status = 'partially_released';
      }

      escrow.updatedAt = new Date();

      return {
        success: true,
        data: escrow,
        message: `Released ${amount} ${escrow.currency} to ${escrow.payee}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to release funds: ${error.message}`,
      };
    }
  }

  /**
   * Refund funds to payer
   */
  async refund(
    escrowId: string,
    amount: number,
    reason: string
  ): Promise<OperationResult<EscrowAccount>> {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        return {
          success: false,
          error: `Escrow ${escrowId} not found`,
        };
      }

      if (amount <= 0 || amount > escrow.balance) {
        return {
          success: false,
          error: `Invalid refund amount. Available balance: ${escrow.balance}`,
        };
      }

      // Create refund transaction
      const transaction: EscrowTransaction = {
        id: `tx_${nanoid(12)}`,
        type: 'refund',
        amount,
        from: escrowId,
        to: escrow.payer,
        reason,
        timestamp: new Date(),
        status: 'completed',
      };

      // Update balance
      escrow.balance -= amount;
      escrow.transactions.push(transaction);

      // Update status
      if (escrow.balance === 0) {
        escrow.status = 'refunded';
      }

      escrow.updatedAt = new Date();

      return {
        success: true,
        data: escrow,
        message: `Refunded ${amount} ${escrow.currency} to ${escrow.payer}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to refund: ${error.message}`,
      };
    }
  }

  /**
   * Release funds based on milestone completion
   */
  async releaseForMilestone(
    contractId: string,
    milestoneId: string,
    contract: Contract
  ): Promise<OperationResult<EscrowAccount>> {
    try {
      // Find escrow for this contract
      const escrow = this.findEscrowByContract(contractId);
      if (!escrow) {
        return {
          success: false,
          error: `No escrow found for contract ${contractId}`,
        };
      }

      // Find milestone in payment terms
      const milestone = contract.terms.payment.milestones?.find(
        m => m.id === milestoneId
      );

      if (!milestone) {
        return {
          success: false,
          error: `Milestone ${milestoneId} not found in contract`,
        };
      }

      if (milestone.status !== 'completed') {
        return {
          success: false,
          error: `Milestone must be completed before payment release`,
        };
      }

      // Release milestone amount
      return await this.release(
        escrow.id,
        milestone.amount,
        `Milestone completion: ${milestone.name}`,
        milestoneId
      );
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to release milestone payment: ${error.message}`,
      };
    }
  }

  /**
   * Add release condition to escrow
   */
  async addReleaseCondition(
    escrowId: string,
    condition: Omit<ReleaseCondition, 'id' | 'status'>
  ): Promise<OperationResult<EscrowAccount>> {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        return {
          success: false,
          error: `Escrow ${escrowId} not found`,
        };
      }

      const releaseCondition: ReleaseCondition = {
        id: `cond_${nanoid(10)}`,
        ...condition,
        status: 'pending',
      };

      if (!escrow.releaseConditions) {
        escrow.releaseConditions = [];
      }

      escrow.releaseConditions.push(releaseCondition);
      escrow.updatedAt = new Date();

      return {
        success: true,
        data: escrow,
        message: 'Release condition added',
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to add release condition: ${error.message}`,
      };
    }
  }

  /**
   * Verify and update release condition
   */
  async verifyCondition(
    escrowId: string,
    conditionId: string,
    met: boolean,
    verifier: string
  ): Promise<OperationResult<ReleaseCondition>> {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow || !escrow.releaseConditions) {
        return {
          success: false,
          error: `Escrow or conditions not found`,
        };
      }

      const condition = escrow.releaseConditions.find(c => c.id === conditionId);
      if (!condition) {
        return {
          success: false,
          error: `Condition ${conditionId} not found`,
        };
      }

      condition.status = met ? 'met' : 'failed';
      condition.verifier = verifier;
      condition.verifiedAt = new Date();
      escrow.updatedAt = new Date();

      return {
        success: true,
        data: condition,
        message: `Condition ${met ? 'met' : 'failed'}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to verify condition: ${error.message}`,
      };
    }
  }

  /**
   * Check if all release conditions are met
   */
  areAllConditionsMet(escrowId: string): boolean {
    const escrow = this.escrows.get(escrowId);
    if (!escrow || !escrow.releaseConditions || escrow.releaseConditions.length === 0) {
      return true; // No conditions means auto-release
    }

    return escrow.releaseConditions.every(c => c.status === 'met');
  }

  /**
   * Get escrow by ID
   */
  getEscrow(escrowId: string): EscrowAccount | undefined {
    return this.escrows.get(escrowId);
  }

  /**
   * Find escrow by contract ID
   */
  findEscrowByContract(contractId: string): EscrowAccount | undefined {
    return Array.from(this.escrows.values()).find(
      e => e.contractId === contractId
    );
  }

  /**
   * List all escrows
   */
  listEscrows(filter?: {
    status?: EscrowStatus;
    contractId?: string;
    payer?: string;
    payee?: string;
  }): EscrowAccount[] {
    let escrows = Array.from(this.escrows.values());

    if (filter) {
      if (filter.status) {
        escrows = escrows.filter(e => e.status === filter.status);
      }
      if (filter.contractId) {
        escrows = escrows.filter(e => e.contractId === filter.contractId);
      }
      if (filter.payer) {
        escrows = escrows.filter(e => e.payer === filter.payer);
      }
      if (filter.payee) {
        escrows = escrows.filter(e => e.payee === filter.payee);
      }
    }

    return escrows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Calculate total deposited
   */
  getTotalDeposited(escrowId: string): number {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) return 0;

    return escrow.transactions
      .filter(tx => tx.type === 'deposit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  /**
   * Calculate total released
   */
  getTotalReleased(escrowId: string): number {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) return 0;

    return escrow.transactions
      .filter(tx => tx.type === 'release' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  /**
   * Calculate total refunded
   */
  getTotalRefunded(escrowId: string): number {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) return 0;

    return escrow.transactions
      .filter(tx => tx.type === 'refund' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }
}
