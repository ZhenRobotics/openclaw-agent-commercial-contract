/**
 * Identity Manager - Agent identity and authentication
 */

import { nanoid } from 'nanoid';
import * as crypto from 'crypto';
import {
  AgentIdentity,
  AgentCredentials,
  OperationResult,
} from './types';

export class IdentityManager {
  private agents: Map<string, AgentIdentity> = new Map();
  private credentials: Map<string, AgentCredentials> = new Map();

  /**
   * Register a new agent
   */
  async registerAgent(
    name: string,
    capabilities?: string[],
    endpoint?: string,
    metadata?: Record<string, any>
  ): Promise<OperationResult<{ identity: AgentIdentity; credentials: AgentCredentials }>> {
    try {
      // Generate agent ID
      const agentId = `agent_${nanoid(16)}`;

      // Generate key pair for signing
      const { publicKey, privateKey } = this.generateKeyPair();

      // Generate API key
      const apiKey = this.generateApiKey();

      // Create identity
      const identity: AgentIdentity = {
        id: agentId,
        name,
        publicKey,
        endpoint,
        capabilities: capabilities || [],
        metadata: metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create credentials
      const credentials: AgentCredentials = {
        agentId,
        privateKey,
        apiKey,
      };

      // Store
      this.agents.set(agentId, identity);
      this.credentials.set(agentId, credentials);

      return {
        success: true,
        data: { identity, credentials },
        message: `Agent ${name} registered with ID ${agentId}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to register agent: ${error.message}`,
      };
    }
  }

  /**
   * Get agent identity by ID
   */
  getAgent(agentId: string): AgentIdentity | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agent credentials (private - should be protected)
   */
  getCredentials(agentId: string): AgentCredentials | undefined {
    return this.credentials.get(agentId);
  }

  /**
   * Verify agent signature
   */
  verifySignature(
    agentId: string,
    message: string,
    signature: string
  ): boolean {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        return false;
      }

      // In production, use proper cryptographic verification
      // This is a simplified version
      const verify = crypto.createVerify('SHA256');
      verify.update(message);
      verify.end();

      return verify.verify(agent.publicKey, signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  /**
   * Sign a message with agent's private key
   */
  signMessage(agentId: string, message: string): string | null {
    try {
      const credentials = this.credentials.get(agentId);
      if (!credentials) {
        return null;
      }

      // In production, use proper cryptographic signing
      const sign = crypto.createSign('SHA256');
      sign.update(message);
      sign.end();

      return sign.sign(credentials.privateKey, 'hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Authenticate agent by API key
   */
  authenticateByApiKey(apiKey: string): AgentIdentity | null {
    for (const [agentId, creds] of this.credentials.entries()) {
      if (creds.apiKey === apiKey) {
        return this.agents.get(agentId) || null;
      }
    }
    return null;
  }

  /**
   * Update agent capabilities
   */
  updateCapabilities(
    agentId: string,
    capabilities: string[]
  ): OperationResult<AgentIdentity> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return {
        success: false,
        error: `Agent ${agentId} not found`,
      };
    }

    agent.capabilities = capabilities;
    agent.updatedAt = new Date();

    return {
      success: true,
      data: agent,
      message: 'Capabilities updated',
    };
  }

  /**
   * Update agent endpoint
   */
  updateEndpoint(
    agentId: string,
    endpoint: string
  ): OperationResult<AgentIdentity> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return {
        success: false,
        error: `Agent ${agentId} not found`,
      };
    }

    agent.endpoint = endpoint;
    agent.updatedAt = new Date();

    return {
      success: true,
      data: agent,
      message: 'Endpoint updated',
    };
  }

  /**
   * List all agents
   */
  listAgents(filter?: {
    capability?: string;
    name?: string;
  }): AgentIdentity[] {
    let agents = Array.from(this.agents.values());

    if (filter) {
      if (filter.capability) {
        agents = agents.filter(a =>
          a.capabilities?.includes(filter.capability!)
        );
      }
      if (filter.name) {
        agents = agents.filter(a =>
          a.name.toLowerCase().includes(filter.name!.toLowerCase())
        );
      }
    }

    return agents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Generate RSA key pair
   */
  private generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Generate API key
   */
  private generateApiKey(): string {
    return `acc_${nanoid(32)}`;
  }
}
