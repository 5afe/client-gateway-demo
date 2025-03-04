import { 
    createPublicClient, 
    createWalletClient,
    http, 
    type Hash, 
    type Hex, 
    encodeAbiParameters, 
    encodePacked, 
    keccak256,
    type Chain,
    type Account
  } from 'viem';
  import { privateKeyToAccount } from 'viem/accounts';
  import { mainnet } from 'viem/chains';
  
  // Base API URL
  const BASE_URL = 'https://safe-client.safe.global';
  
  // Types
  export interface AddressInfo {
    value: string;
    name: string | null;
    logoUri: string | null;
  }
  
  export interface SafeInfo {
    address: AddressInfo;
    chainId: string;
    nonce: number;
    threshold: number;
    owners: AddressInfo[];
    implementation: AddressInfo;
    implementationVersionState: 'UP_TO_DATE' | 'OUTDATED' | 'UNKNOWN';
    modules: AddressInfo[] | null;
    fallbackHandler: AddressInfo | null;
    guard: AddressInfo | null;
    version: string;
  }
  
  export interface SafeTransactionData {
    to: string;
    value: bigint;
    data: string;
    operation: number;
    safeTxGas: bigint;
    baseGas: bigint;
    gasPrice: bigint;
    gasToken: string;
    refundReceiver: string;
    nonce: bigint;
  }
  
  export interface ProposeTransactionDto {
    to: string;
    value: string;
    data: string | null;
    nonce: string;
    operation: number;
    safeTxGas: string;
    baseGas: string;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string | null;
    safeTxHash: string;
    sender: string;
    signature: string | null;
    origin: string | null;
  }
  
  export interface ExecuteTransactionParams {
    to: string;
    value: bigint;
    data: string;
    operation: number;
    safeTxGas: bigint;
    baseGas: bigint;
    gasPrice: bigint;
    gasToken: string;
    refundReceiver: string;
    signatures: string;
  }
  
  // Constants for hash computation
  const SAFE_TX_TYPEHASH = '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8';
  const DOMAIN_SEPARATOR_TYPEHASH = '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218';
  
  /**
   * Safe Client API Class
   * A wrapper around the Safe Client API with Viem integration
   */
  export class SafeClient {
    private baseUrl: string;
  
    constructor(baseUrl: string = BASE_URL) {
      this.baseUrl = baseUrl;
    }
  
    /**
     * Check if a chain is supported by the Safe Client API
     * @param chainId The chain ID to check
     * @returns A boolean indicating if the chain is supported
     */
    async isChainSupported(chainId: string): Promise<boolean> {
      try {
        const response = await fetch(`${this.baseUrl}/v1/chains/${chainId}`);
        
        if (response.status === 404) {
          console.log(`Chain ${chainId} is not supported`);
          return false;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const chainData = await response.json();
        console.log(`Chain ${chainId} is supported:`);
        return true;
      } catch (error) {
        console.error('Error checking chain support:', error);
        throw error;
      }
    }
  
    /**
     * Get all supported chains from the Safe Client API
     * @returns Array of supported chains
     */
    async getSupportedChains(): Promise<any[]> {
      try {
        const response = await fetch(`${this.baseUrl}/v1/chains`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.results;
      } catch (error) {
        console.error('Error fetching supported chains:', error);
        throw error;
      }
    }
  
    /**
     * Get detailed information about a Safe
     * @param chainId The chain ID
     * @param safeAddress The Safe address
     * @returns Safe information
     */
    async getSafeInfo(chainId: string, safeAddress: string): Promise<SafeInfo> {
      try {
        // Input validation
        if (!chainId || !safeAddress) {
          throw new Error('Chain ID and Safe address are required');
        }
        
        if (!/^0x[a-fA-F0-9]{40}$/.test(safeAddress)) {
          throw new Error('Invalid Safe address format');
        }
        
        const response = await fetch(
          `${this.baseUrl}/v1/chains/${chainId}/safes/${safeAddress}`
        );
        
        if (response.status === 404) {
          throw new Error(`Safe not found on chain ${chainId}`);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const safeInfo = await response.json();
        
        // Validate essential data
        if (!safeInfo.address || !safeInfo.owners) {
          throw new Error('Invalid Safe data received');
        }
        
        return safeInfo;
      } catch (error) {
        console.error('Error in getSafeInfo:', error);
        throw error;
      }
    }
  
    /**
     * Get transaction history for a Safe
     * @param chainId The chain ID
     * @param safeAddress The Safe address
     * @param options Optional parameters (trusted, cursor, timezone)
     * @returns Transaction history
     */
    async getTransactionHistory(
      chainId: string, 
      safeAddress: string, 
      options: { trusted?: boolean; cursor?: string; timezone?: string } = {}
    ): Promise<any> {
      try {
        const queryParams = new URLSearchParams({
          ...(options.trusted !== undefined && { trusted: options.trusted.toString() }),
          ...(options.cursor && { cursor: options.cursor }),
          ...(options.timezone && { timezone: options.timezone })
        }).toString();
  
        const url = `${this.baseUrl}/v1/chains/${chainId}/safes/${safeAddress}/transactions/history${
          queryParams ? `?${queryParams}` : ''
        }`;
  
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const history = await response.json();
        return history;
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        throw error;
      }
    }
  
    /**
     * Get pending transactions for a Safe
     * @param chainId The chain ID
     * @param safeAddress The Safe address
     * @param options Optional parameters (trusted, cursor)
     * @returns Pending transactions
     */
    async getPendingTransactions(
      chainId: string, 
      safeAddress: string, 
      options: { trusted?: boolean; cursor?: string } = {}
    ): Promise<any> {
      try {
        const queryParams = new URLSearchParams({
          ...(options.trusted !== undefined && { trusted: options.trusted.toString() }),
          ...(options.cursor && { cursor: options.cursor })
        }).toString();
  
        const url = `${this.baseUrl}/v1/chains/${chainId}/safes/${safeAddress}/transactions/queued${
          queryParams ? `?${queryParams}` : ''
        }`;
  
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pendingTxs = await response.json();
        return pendingTxs;
      } catch (error) {
        console.error('Error fetching pending transactions:', error);
        throw error;
      }
    }
  
    /**
     * Calculate the Safe transaction hash
     * @param safeAddress The Safe address
     * @param chainId The chain ID
     * @param txData Transaction data
     * @returns The Safe transaction hash
     */
    async calculateSafeTransactionHash(
      safeAddress: string,
      chainId: bigint,
      txData: SafeTransactionData
    ): Promise<Hash> {
      // 1. Calculate domain separator
      const domainSeparator = keccak256(
        encodeAbiParameters(
          [
            { type: 'bytes32', name: 'typeHash' },
            { type: 'uint256', name: 'chainId' },
            { type: 'address', name: 'safe' },
          ],
          [
            DOMAIN_SEPARATOR_TYPEHASH,
            chainId,
            safeAddress as `0x${string}`,
          ]
        )
      );
  
      // 2. Calculate safeTxHash
      const safeTxHash = keccak256(
        encodeAbiParameters(
          [
            { type: 'bytes32', name: 'typeHash' },
            { type: 'address', name: 'to' },
            { type: 'uint256', name: 'value' },
            { type: 'bytes32', name: 'dataHash' },
            { type: 'uint8', name: 'operation' },
            { type: 'uint256', name: 'safeTxGas' },
            { type: 'uint256', name: 'baseGas' },
            { type: 'uint256', name: 'gasPrice' },
            { type: 'address', name: 'gasToken' },
            { type: 'address', name: 'refundReceiver' },
            { type: 'uint256', name: 'nonce' }
          ],
          [
            SAFE_TX_TYPEHASH,
            txData.to as `0x${string}`,
            txData.value,
            keccak256(txData.data as `0x${string}`),
            txData.operation,
            txData.safeTxGas,
            txData.baseGas,
            txData.gasPrice,
            txData.gasToken as `0x${string}`,
            txData.refundReceiver as `0x${string}`,
            txData.nonce
          ]
        )
      );
  
      // 3. Encode final hash
      return keccak256(
        encodePacked(
          ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
          ['0x19', '0x01', domainSeparator, safeTxHash]
        )
      );
    }
  
    /**
     * Propose a transaction to a Safe
     * @param chainId The chain ID
     * @param safeAddress The Safe address
     * @param txData Transaction data
     * @returns The proposed transaction
     */
    async proposeTransaction(
      chainId: string, 
      safeAddress: string, 
      txData: ProposeTransactionDto
    ): Promise<any> {
      try {
        const response = await fetch(
          `${this.baseUrl}/v1/chains/${chainId}/transactions/${safeAddress}/propose`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(txData)
          }
        );
        console.log(txData);
        
        if (!response.ok) {
          console.log(response);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error proposing transaction:', error);
        throw error;
      }
    }
  
    /**
     * Add a confirmation to a transaction
     * @param chainId The chain ID
     * @param safeTxHash The Safe transaction hash
     * @param signature The signature
     * @returns The updated transaction
     */
    async signTransaction(
      chainId: string, 
      safeTxHash: Hash, 
      signature: Hex
    ): Promise<any> {
      try {
        const response = await fetch(
          `${this.baseUrl}/v1/chains/${chainId}/transactions/${safeTxHash}/confirmations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ signature })
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error signing transaction:', error);
        throw error;
      }
    }
  
    /**
     * Verify if a transaction has enough signatures before execution
     * @param chainId The chain ID
     * @param safeTxHash The Safe transaction hash
     * @returns A boolean indicating if the transaction is ready to execute
     */
    async verifySignatures(chainId: string, safeTxHash: Hash): Promise<boolean> {
      try {
        const response = await fetch(
          `${this.baseUrl}/v1/chains/${chainId}/transactions/${safeTxHash}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const txInfo = await response.json();
        return txInfo.detailedExecutionInfo.confirmations.length >= txInfo.detailedExecutionInfo.confirmationsRequired;
      } catch (error) {
        console.error('Error verifying signatures:', error);
        throw error;
      }
    }
  
    /**
     * Execute a transaction on-chain
     * @param provider URL The viem chain
     * @param safeAddress The Safe address
     * @param params Transaction parameters
     * @param account The account to execute with
     * @returns The transaction receipt
     */
    async executeTransaction(
      chain: Chain,
      safeAddress: string,
      params: ExecuteTransactionParams,
      account: Account
    ): Promise<any> {
      // ABI for the execTransaction function
      const safeAbi = [{
        "inputs": [
          { "name": "to", "type": "address" },
          { "name": "value", "type": "uint256" },
          { "name": "data", "type": "bytes" },
          { "name": "operation", "type": "uint8" },
          { "name": "safeTxGas", "type": "uint256" },
          { "name": "baseGas", "type": "uint256" },
          { "name": "gasPrice", "type": "uint256" },
          { "name": "gasToken", "type": "address" },
          { "name": "refundReceiver", "type": "address" },
          { "name": "signatures", "type": "bytes" }
        ],
        "name": "execTransaction",
        "outputs": [{ "name": "success", "type": "bool" }],
        "type": "function"
      }] as const;
  
      // 1. Create Viem clients
      const publicClient = createPublicClient({
        chain: chain,
        transport: http(chain.rpcUrls.default.http[0])
      });
  
      const walletClient = createWalletClient({
        chain: chain,
        transport: http(chain.rpcUrls.default.http[0]),
        account
      });
  
      // 2. Prepare transaction
      const { request } = await publicClient.simulateContract({
        address: safeAddress as `0x${string}`,
        abi: safeAbi,
        functionName: 'execTransaction',
        args: [
          params.to as `0x${string}`,
          params.value,
          params.data as `0x${string}`,
          params.operation,
          params.safeTxGas,
          params.baseGas,
          params.gasPrice,
          params.gasToken as `0x${string}`,
          params.refundReceiver as `0x${string}`,
          params.signatures as `0x${string}`
        ],
        account
      });
  
      // 3. Execute transaction
      const hash = await walletClient.writeContract(request);
      
      // 4. Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return receipt;
    }
  
    /**
     * Helper function to combine signatures
     * @param signatures Array of signatures
     * @returns Combined signatures string
     */
    combineSignatures(signatures: Array<{ signer: {value:string}, signature: string }>): string {
      // Sort signatures by signer address (required by the Safe contract)
      const sortedSigs = signatures.sort((a, b) => 
        a.signer.value.toLowerCase().localeCompare(b.signer.value.toLowerCase())
      );
      
      // Concatenate signatures
      return '0x' + sortedSigs.map(sig => sig.signature.slice(2)).join('');
    }
  }