/**
 * Dispute Manager - Handle contract disputes and resolution
 */

import { nanoid } from 'nanoid';
import * as crypto from 'crypto';
import {
  Dispute,
  DisputeType,
  DisputeStatus,
  Evidence,
  DisputeResolution,
  Contract,
  OperationResult,
} from './types';

export class DisputeManager {
  private disputes: Map<string, Dispute> = new Map();

  /**
   * Raise a new dispute
   */
  async raiseDispute(
    contractId: string,
    plaintiff: string,
    defendant: string,
    type: DisputeType,
    description: string,
    initialEvidence?: Evidence[]
  ): Promise<OperationResult<Dispute>> {
    try {
      const disputeId = `dispute_${nanoid(16)}`;

      const dispute: Dispute = {
        id: disputeId,
        contractId,
        plaintiff,
        defendant,
        type,
        description,
        evidence: initialEvidence || [],
        status: 'open',
        raisedAt: new Date(),
      };

      this.disputes.set(disputeId, dispute);

      return {
        success: true,
        data: dispute,
        message: `Dispute ${disputeId} raised successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to raise dispute: ${error.message}`,
      };
    }
  }

  /**
   * Submit evidence to a dispute
   */
  async submitEvidence(
    disputeId: string,
    submittedBy: string,
    type: Evidence['type'],
    title: string,
    description: string,
    data: string | Record<string, any>
  ): Promise<OperationResult<Dispute>> {
    try {
      const dispute = this.disputes.get(disputeId);
      if (!dispute) {
        return {
          success: false,
          error: `Dispute ${disputeId} not found`,
        };
      }

      if (dispute.status === 'resolved' || dispute.status === 'withdrawn') {
        return {
          success: false,
          error: `Cannot submit evidence to ${dispute.status} dispute`,
        };
      }

      // Create evidence
      const evidence: Evidence = {
        id: `evidence_${nanoid(12)}`,
        submittedBy,
        type,
        title,
        description,
        data,
        submittedAt: new Date(),
        hash: this.hashData(data),
      };

      dispute.evidence.push(evidence);

      // Update status if needed
      if (dispute.status === 'awaiting_evidence') {
        dispute.status = 'under_review';
      }

      return {
        success: true,
        data: dispute,
        message: `Evidence submitted to dispute ${disputeId}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to submit evidence: ${error.message}`,
      };
    }
  }

  /**
   * Assign arbitrator to dispute
   */
  async assignArbitrator(
    disputeId: string,
    arbitratorId: string
  ): Promise<OperationResult<Dispute>> {
    try {
      const dispute = this.disputes.get(disputeId);
      if (!dispute) {
        return {
          success: false,
          error: `Dispute ${disputeId} not found`,
        };
      }

      if (dispute.status === 'resolved') {
        return {
          success: false,
          error: 'Cannot assign arbitrator to resolved dispute',
        };
      }

      dispute.arbitrator = arbitratorId;
      dispute.status = 'in_arbitration';

      return {
        success: true,
        data: dispute,
        message: `Arbitrator ${arbitratorId} assigned to dispute`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to assign arbitrator: ${error.message}`,
      };
    }
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    disputeId: string,
    outcome: DisputeResolution['outcome'],
    ruling: string,
    decidedBy: string,
    compensation?: {
      amount: number;
      from: string;
      to: string;
      reason: string;
    }
  ): Promise<OperationResult<Dispute>> {
    try {
      const dispute = this.disputes.get(disputeId);
      if (!dispute) {
        return {
          success: false,
          error: `Dispute ${disputeId} not found`,
        };
      }

      if (dispute.status === 'resolved') {
        return {
          success: false,
          error: 'Dispute already resolved',
        };
      }

      const resolution: DisputeResolution = {
        outcome,
        ruling,
        compensation,
        decidedBy,
        decidedAt: new Date(),
      };

      dispute.resolution = resolution;
      dispute.status = 'resolved';
      dispute.resolvedAt = new Date();

      return {
        success: true,
        data: dispute,
        message: `Dispute ${disputeId} resolved in ${outcome}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to resolve dispute: ${error.message}`,
      };
    }
  }

  /**
   * Withdraw dispute
   */
  async withdrawDispute(
    disputeId: string,
    withdrawnBy: string
  ): Promise<OperationResult<Dispute>> {
    try {
      const dispute = this.disputes.get(disputeId);
      if (!dispute) {
        return {
          success: false,
          error: `Dispute ${disputeId} not found`,
        };
      }

      if (dispute.plaintiff !== withdrawnBy) {
        return {
          success: false,
          error: 'Only the plaintiff can withdraw a dispute',
        };
      }

      if (dispute.status === 'resolved') {
        return {
          success: false,
          error: 'Cannot withdraw resolved dispute',
        };
      }

      dispute.status = 'withdrawn';

      return {
        success: true,
        data: dispute,
        message: `Dispute ${disputeId} withdrawn`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to withdraw dispute: ${error.message}`,
      };
    }
  }

  /**
   * Get dispute by ID
   */
  getDispute(disputeId: string): Dispute | undefined {
    return this.disputes.get(disputeId);
  }

  /**
   * Find disputes by contract
   */
  findDisputesByContract(contractId: string): Dispute[] {
    return Array.from(this.disputes.values())
      .filter(d => d.contractId === contractId)
      .sort((a, b) => b.raisedAt.getTime() - a.raisedAt.getTime());
  }

  /**
   * List all disputes
   */
  listDisputes(filter?: {
    status?: DisputeStatus;
    type?: DisputeType;
    plaintiff?: string;
    defendant?: string;
    arbitrator?: string;
  }): Dispute[] {
    let disputes = Array.from(this.disputes.values());

    if (filter) {
      if (filter.status) {
        disputes = disputes.filter(d => d.status === filter.status);
      }
      if (filter.type) {
        disputes = disputes.filter(d => d.type === filter.type);
      }
      if (filter.plaintiff) {
        disputes = disputes.filter(d => d.plaintiff === filter.plaintiff);
      }
      if (filter.defendant) {
        disputes = disputes.filter(d => d.defendant === filter.defendant);
      }
      if (filter.arbitrator) {
        disputes = disputes.filter(d => d.arbitrator === filter.arbitrator);
      }
    }

    return disputes.sort((a, b) => b.raisedAt.getTime() - a.raisedAt.getTime());
  }

  /**
   * Get dispute statistics
   */
  getStatistics(filter?: { contractId?: string; agentId?: string }) {
    let disputes = Array.from(this.disputes.values());

    if (filter?.contractId) {
      disputes = disputes.filter(d => d.contractId === filter.contractId);
    }
    if (filter?.agentId) {
      disputes = disputes.filter(
        d => d.plaintiff === filter.agentId || d.defendant === filter.agentId
      );
    }

    return {
      total: disputes.length,
      open: disputes.filter(d => d.status === 'open').length,
      underReview: disputes.filter(d => d.status === 'under_review').length,
      inArbitration: disputes.filter(d => d.status === 'in_arbitration').length,
      resolved: disputes.filter(d => d.status === 'resolved').length,
      withdrawn: disputes.filter(d => d.status === 'withdrawn').length,
      averageResolutionTime: this.calculateAverageResolutionTime(disputes),
    };
  }

  /**
   * Calculate average resolution time in days
   */
  private calculateAverageResolutionTime(disputes: Dispute[]): number {
    const resolved = disputes.filter(d => d.status === 'resolved' && d.resolvedAt);

    if (resolved.length === 0) return 0;

    const totalDays = resolved.reduce((sum, d) => {
      const days =
        (d.resolvedAt!.getTime() - d.raisedAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return Math.round(totalDays / resolved.length);
  }

  /**
   * Hash data for evidence verification
   */
  private hashData(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify evidence hash
   */
  verifyEvidenceHash(evidence: Evidence): boolean {
    const currentHash = this.hashData(evidence.data);
    return currentHash === evidence.hash;
  }
}
