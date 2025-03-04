# Safe Client API Tutorial

## Introduction

This tutorial demonstrates how to use the [Safe Client API](https://safe-client.safe.global/api#/) to interact programmatically with your Safe account and how to migrate from using the [Safe Transaction Service](https://github.com/safe-global/safe-transaction-service).

Previously, users were using the [Safe Transaction Service](https://github.com/safe-global/safe-transaction-service) either directly or in conjunction with the [@safe-global/api-kit](https://www.npmjs.com/package/@safe-global/api-kit) npm package.

## What You'll Learn

This guide provides a quick introduction to:

- Verify if a chain is available
- Fetch information about a Safe
- Fetch the transaction history
- Fetch pending transactions
- Propose a transaction
- Sign a transaction
- Execute a transaction

## API URL Structure

### Previous Transaction Service

Previously, a new transaction service with a specific URL was created for each chain with the following pattern:

```
https://safe-transaction-<networkName>.safe.global
```

For example: [https://safe-transaction-polygon.safe.global](https://safe-transaction-polygon.safe.global/)

Notice that the URL holds the chain name, therefore the data will only come from one chain.

### New Safe Client API

With the Safe Client API, the URL is chain agnostic:

```
https://safe-client.safe.global/api#/
```

The `chainId` will be passed as a parameter to the endpoint you are querying, making it more flexible and consistent across different chains.

## Verifying Chain Availability

To check if a specific chain is supported by the Safe Client API, you can use the `/v1/chains` endpoint. This endpoint returns information about all supported chains, or you can query a specific chain using `/v1/chains/{chainId}`.

### Using curl

To get all supported chains:
```bash
curl -X GET "https://safe-client.safe.global/v1/chains"
```

To check a specific chain (e.g., Ethereum Mainnet with chainId "1"):
```bash
curl -X GET "https://safe-client.safe.global/v1/chains/1"
```

### Using JavaScript Fetch

To get all supported chains:
```javascript
const getAllChains = async () => {
  try {
    const response = await fetch('https://safe-client.safe.global/v1/chains');
    const data = await response.json();
    console.log('Supported chains:', data);
  } catch (error) {
    console.error('Error fetching chains:', error);
  }
};
```

To check a specific chain:
```javascript
const checkChain = async (chainId) => {
  try {
    const response = await fetch(`https://safe-client.safe.global/v1/chains/${chainId}`);
    if (response.ok) {
      const chainData = await response.json();
      console.log('Chain is supported:', chainData);
      return true;
    } else {
      console.log('Chain is not supported');
      return false;
    }
  } catch (error) {
    console.error('Error checking chain:', error);
    return false;
  }
};
```

### Response Structure

The response for a supported chain will include detailed information about the chain:

```json
{
  "chainId": "1",
  "chainName": "Ethereum",
  "description": "Ethereum Mainnet",
  "l2": false,
  "isTestnet": false,
  "nativeCurrency": {
    "name": "Ether",
    "symbol": "ETH",
    "decimals": 18,
    "logoUri": "..."
  },
  "transactionService": "...",
  "blockExplorerUriTemplate": {
    "address": "...",
    "txHash": "...",
    "api": "..."
  },
  // Additional chain properties...
}
```

## Fetching Safe Information

To get detailed information about a Safe, you can use the `/v1/chains/{chainId}/safes/{safeAddress}` endpoint. This endpoint provides comprehensive details about a Safe's configuration, owners, and current state.

### Using curl

```bash
# Replace with your actual chain ID and Safe address
curl -X GET "https://safe-client.safe.global/v1/chains/1/safes/0x123...789"
```

### Using JavaScript Fetch

```javascript
const getSafeInfo = async (chainId, safeAddress) => {
  try {
    const response = await fetch(
      `https://safe-client.safe.global/v1/chains/${chainId}/safes/${safeAddress}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const safeInfo = await response.json();
    return safeInfo;
  } catch (error) {
    console.error('Error fetching Safe info:', error);
    throw error;
  }
};
```

### Response Structure

The response includes detailed information about the Safe:

```json
{
  "address": {
    "value": "0x123...789",
    "name": null,
    "logoUri": null
  },
  "chainId": "1",
  "nonce": 42,
  "threshold": 2,
  "owners": [
    {
      "value": "0xowner1...abc",
      "name": null,
      "logoUri": null
    },
    {
      "value": "0xowner2...def",
      "name": null,
      "logoUri": null
    }
  ],
  "implementation": {
    "value": "0ximpl...xyz",
    "name": null,
    "logoUri": null
  },
  "implementationVersionState": "UP_TO_DATE",
  "modules": null,
  "fallbackHandler": null,
  "guard": null,
  "version": "1.3.0"
}
```

### Understanding the Response

- `address`: The Safe's address on the blockchain
- `chainId`: The chain where the Safe is deployed
- `nonce`: Current transaction count
- `threshold`: Number of required confirmations for transactions
- `owners`: List of addresses that can sign transactions
- `implementation`: The Safe contract implementation address
- `implementationVersionState`: Indicates if the Safe contract is up to date
- `version`: The version of the Safe contract

### Additional Safe Information

You can also fetch additional details about a Safe:

#### Get Safe Nonces
```javascript
const getSafeNonces = async (chainId, safeAddress) => {
  try {
    const response = await fetch(
      `https://safe-client.safe.global/v1/chains/${chainId}/safes/${safeAddress}/nonces`
    );
    const nonces = await response.json();
    return nonces;
  } catch (error) {
    console.error('Error fetching nonces:', error);
    throw error;
  }
};
```

#### Get Safe Creation Info
```javascript
const getSafeCreationInfo = async (chainId, safeAddress) => {
  try {
    const response = await fetch(
      `https://safe-client.safe.global/v1/chains/${chainId}/safes/${safeAddress}/creation`
    );
    const creationInfo = await response.json();
    return creationInfo;
  } catch (error) {
    console.error('Error fetching creation info:', error);
    throw error;
  }
};
```

## Fetching Transaction History

The Safe Client API provides a comprehensive endpoint to fetch the transaction history of a Safe. You can use the `/v1/chains/{chainId}/safes/{safeAddress}/transactions/history` endpoint to retrieve all historical transactions.

### Using curl

```bash
# Basic usage
curl -X GET "https://safe-client.safe.global/v1/chains/1/safes/0x123...789/transactions/history"

# With optional parameters
curl -X GET "https://safe-client.safe.global/v1/chains/1/safes/0x123...789/transactions/history?trusted=true&cursor=CURSOR_VALUE"
```

### Using JavaScript Fetch

```javascript
const getTransactionHistory = async (chainId, safeAddress, options = {}) => {
  try {
    const queryParams = new URLSearchParams({
      ...(options.trusted !== undefined && { trusted: options.trusted }),
      ...(options.cursor && { cursor: options.cursor }),
      ...(options.timezone && { timezone: options.timezone })
    }).toString();

    const url = `https://safe-client.safe.global/v1/chains/${chainId}/safes/${safeAddress}/transactions/history${
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
};
```

### Response Structure

The response includes a paginated list of transactions with detailed information:

```json
{
  "count": 100,
  "next": "https://safe-client.safe.global/v1/chains/1/safes/0x123...789/transactions/history?cursor=NEXT_CURSOR",
  "previous": null,
  "results": [
    {
      "type": "TRANSACTION",
      "transaction": {
        "id": "tx_id_1",
        "timestamp": 1677654321,
        "txStatus": "SUCCESS",
        "txInfo": {
          "type": "Transfer",
          "sender": {
            "value": "0xsender...123"
          },
          "recipient": {
            "value": "0xrecipient...456"
          },
          "direction": "OUTGOING",
          "transferInfo": {
            "type": "NATIVE_COIN",
            "value": "1000000000000000000"
          }
        },
        "executionInfo": {
          "type": "MULTISIG",
          "nonce": 42,
          "confirmationsRequired": 2,
          "confirmationsSubmitted": 2
        }
      },
      "conflictType": "None"
    },
    {
      "type": "DATE_LABEL",
      "timestamp": 1677654000
    }
  ]
}
```

### Pagination and Filtering

To handle pagination and implement filtering:

```javascript
const getAllTransactionHistory = async (chainId, safeAddress, options = {}) => {
  let allTransactions = [];
  let nextCursor = null;
  
  do {
    const queryOptions = {
      ...options,
      ...(nextCursor && { cursor: nextCursor })
    };
    
    const response = await getTransactionHistory(chainId, safeAddress, queryOptions);
    
    allTransactions = allTransactions.concat(response.results);
    nextCursor = new URL(response.next).searchParams.get('cursor');
  } while (nextCursor);
  
  return allTransactions;
};
```

### Filtering by Transaction Type

```javascript
const filterTransactionsByType = (transactions, type) => {
  return transactions.filter(tx => 
    tx.type === 'TRANSACTION' && tx.transaction.txInfo.type === type
  );
};

// Example usage:
const getTransferTransactions = async (chainId, safeAddress) => {
  const history = await getTransactionHistory(chainId, safeAddress);
  return filterTransactionsByType(history.results, 'Transfer');
};
```

## Fetching Pending Transactions

The Safe Client API provides an endpoint to fetch pending transactions that are awaiting confirmations or execution. You can use the `/v1/chains/{chainId}/safes/{safeAddress}/transactions/queued` endpoint to retrieve these transactions.

### Using curl

```bash
# Basic usage
curl -X GET "https://safe-client.safe.global/v1/chains/1/safes/0x123...789/transactions/queued"

# With optional parameters
curl -X GET "https://safe-client.safe.global/v1/chains/1/safes/0x123...789/transactions/queued?trusted=true&cursor=CURSOR_VALUE"
```

### Using JavaScript Fetch

```javascript
const getPendingTransactions = async (chainId, safeAddress, options = {}) => {
  try {
    const queryParams = new URLSearchParams({
      ...(options.trusted !== undefined && { trusted: options.trusted }),
      ...(options.cursor && { cursor: options.cursor })
    }).toString();

    const url = `https://safe-client.safe.global/v1/chains/${chainId}/safes/${safeAddress}/transactions/queued${
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
};
```

### Response Structure

The response includes a paginated list of pending transactions:

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "type": "TRANSACTION",
      "transaction": {
        "id": "multisig_0x123...789_1",
        "timestamp": 1677654321,
        "txStatus": "AWAITING_CONFIRMATIONS",
        "txInfo": {
          "type": "Transfer",
          "sender": {
            "value": "0xsender...123"
          },
          "recipient": {
            "value": "0xrecipient...456"
          },
          "direction": "OUTGOING",
          "transferInfo": {
            "type": "ERC20",
            "tokenAddress": "0xtoken...789",
            "value": "1000000000000000000"
          }
        },
        "executionInfo": {
          "type": "MULTISIG",
          "nonce": 42,
          "confirmationsRequired": 2,
          "confirmationsSubmitted": 1
        }
      },
      "conflictType": "None"
    }
  ]
}
```

### Understanding the Response

The response contains several key pieces of information:

- `count`: Total number of pending transactions
- `results`: Array of transaction objects, each containing:
  - `type`: Type of the queue item (usually "TRANSACTION")
  - `transaction`: The transaction details including:
    - `id`: Unique transaction identifier
    - `txStatus`: Current status (e.g., "AWAITING_CONFIRMATIONS", "AWAITING_EXECUTION")
    - `txInfo`: Information about the transaction type and details
    - `executionInfo`: Information about required and submitted confirmations

### Pagination

To fetch all pending transactions with pagination:

```javascript
const getAllPendingTransactions = async (chainId, safeAddress) => {
  let allTransactions = [];
  let nextCursor = null;
  
  do {
    const options = nextCursor ? { cursor: nextCursor } : {};
    const response = await getPendingTransactions(chainId, safeAddress, options);
    
    allTransactions = allTransactions.concat(response.results);
    nextCursor = response.next ? new URL(response.next).searchParams.get('cursor') : null;
  } while (nextCursor);
  
  return allTransactions;
};
```

### Filtering Pending Transactions

To filter pending transactions by specific criteria:

```javascript
const filterPendingByConfirmations = (transactions, requiredConfirmations) => {
  return transactions.filter(tx => 
    tx.type === 'TRANSACTION' && 
    tx.transaction.executionInfo.confirmationsSubmitted < requiredConfirmations
  );
};

// Example usage:
const getTransactionsNeedingConfirmations = async (chainId, safeAddress) => {
  const pendingTxs = await getPendingTransactions(chainId, safeAddress);
  return filterPendingByConfirmations(pendingTxs.results, 2);
};
```

## Proposing a Transaction

The Safe Client API allows you to propose new transactions for a Safe using the `/v1/chains/{chainId}/transactions/{safeAddress}/propose` endpoint.

### Using curl

```bash
curl -X POST "https://safe-client.safe.global/v1/chains/{chainId}/transactions/{safeAddress}/propose" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0xrecipient...456",
    "value": "1000000000000000000",
    "data": "0x",
    "nonce": "1",
    "operation": 0,
    "safeTxGas": "0",
    "baseGas": "0",
    "gasPrice": "0",
    "gasToken": "0x0000000000000000000000000000000000000000",
    "refundReceiver": "0x0000000000000000000000000000000000000000",
    "safeTxHash": "0xhash...789",
    "sender": "0xsender...123",
    "signature": "0xsig...abc",
    "origin": "Safe UI"
  }'
```

### Using JavaScript Fetch

```javascript
const proposeTransaction = async (chainId, safeAddress, transactionData) => {
  try {
    const response = await fetch(
      `https://safe-client.safe.global/v1/chains/${chainId}/transactions/${safeAddress}/propose`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error proposing transaction:', error);
    throw error;
  }
};
```

The Safe transaction hash can get computed by using our SDK https://docs.safe.global/reference-sdk-protocol-kit/transactions/gettransactionhash or can be fetched directly from the smart contract https://github.com/safe-global/safe-smart-account/blob/21dc82410445637820f600c7399a804ad55841d5/contracts/Safe.sol#L383.

### Request Structure

```typescript
interface ProposeTransactionRequest {
  to: string;                 // Target contract/recipient address
  value: string;             // Amount in wei to transfer
  data: string;              // Transaction data (hex-encoded)
  nonce: string;             // Safe transaction nonce
  operation: number;         // Operation type (0 = CALL, 1 = DELEGATE_CALL)
  safeTxGas: string;         // Gas to use for the safe transaction
  baseGas: string;           // Base gas cost
  gasPrice: string;          // Gas price for the transaction
  gasToken: string;          // Token address for gas payment (0x0 for native token)
  refundReceiver: string;    // Address to receive gas payment refund
  safeTxHash: string;        // Hash of the safe transaction
  sender: string;            // Address of the transaction sender
  signature?: string;        // Signature of the sender (optional)
  origin?: string;          // Origin of the transaction (optional)
}

interface TransactionResponse {
  safeTxHash: string;
  txHash?: string;
  sender: AddressInfo;
  confirmationsRequired: number;
  confirmationsSubmitted: number;
  signatures: Array<{
    signer: string;
    signature: string;
    data: string;
  }>;
  executionDate?: string;
  submissionDate: string;
  status: 'AWAITING_CONFIRMATIONS' | 'AWAITING_EXECUTION' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
}
```

### Example Usage

Here's an example of proposing an ETH transfer transaction:

```javascript
const proposeEthTransfer = async (chainId, safeAddress, recipientAddress, amountInWei) => {
  const transactionData = {
    to: recipientAddress,
    value: amountInWei,
    data: '0x',  // Empty data for ETH transfer
    nonce: '1',  // Should be fetched from the Safe
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    safeTxHash: '0x...', // Should be calculated based on the transaction data
    sender: '0x...', // Address of the sender
    signature: '0x...', // Optional: Signature of the sender
    origin: 'API Tutorial' // Optional: Origin of the transaction
  };

  return await proposeTransaction(chainId, safeAddress, transactionData);
};
```

### Response Example

```json
{
  "safeTxHash": "0x...",
  "txHash": null,
  "sender": {
    "value": "0x...",
    "name": null,
    "logoUri": null
  },
  "confirmationsRequired": 2,
  "confirmationsSubmitted": 1,
  "signatures": [
    {
      "signer": "0x...",
      "signature": "0x...",
      "data": "0x..."
    }
  ],
  "executionDate": null,
  "submissionDate": "2024-02-20T10:00:00Z",
  "status": "AWAITING_CONFIRMATIONS"
}
```

### Computing Safe Transaction Hash with Viem

To compute the Safe transaction hash using viem, you'll need to implement the same hashing logic as the Smart Contract. Here's how to do it:

```typescript
import { encodeAbiParameters, encodePacked, keccak256 } from 'viem'

interface SafeTransactionData {
  to: string
  value: bigint
  data: string
  operation: number
  safeTxGas: bigint
  baseGas: bigint
  gasPrice: bigint
  gasToken: string
  refundReceiver: string
  nonce: bigint
}

// Constants
const SAFE_TX_TYPEHASH = '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8'
const DOMAIN_SEPARATOR_TYPEHASH = '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218';

const calculateSafeTransactionHash = async (
  safeAddress: string,
  chainId: bigint,
  safeTransactionData: SafeTransactionData
) => {
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
  )

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
        safeTransactionData.to as `0x${string}`,
        safeTransactionData.value,
        keccak256(safeTransactionData.data as `0x${string}`),
        safeTransactionData.operation,
        safeTransactionData.safeTxGas,
        safeTransactionData.baseGas,
        safeTransactionData.gasPrice,
        safeTransactionData.gasToken as `0x${string}`,
        safeTransactionData.refundReceiver as `0x${string}`,
        safeTransactionData.nonce
      ]
    )
  )

  // 3. Encode final hash
  return keccak256(
    encodePacked(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      ['0x19', '0x01', domainSeparator, safeTxHash]
    )
  )
}

// Example usage
const computeAndProposeTx = async (
  chainId: bigint,
  safeAddress: string,
  transactionData: SafeTransactionData
) => {
  const safeTxHash = await calculateSafeTransactionHash(
    safeAddress,
    chainId,
    transactionData
  )

  const proposalData = {
    ...transactionData,
    safeTxHash,
    value: transactionData.value.toString(),
    safeTxGas: transactionData.safeTxGas.toString(),
    baseGas: transactionData.baseGas.toString(),
    gasPrice: transactionData.gasPrice.toString(),
    nonce: transactionData.nonce.toString()
  }

  return await proposeTransaction(chainId.toString(), safeAddress, proposalData)
}

// Example with actual values
const example = async () => {
  const tx = {
    to: '0x1234...', // recipient address
    value: BigInt(1000000000000000000), // 1 ETH in wei
    data: '0x', // empty data for ETH transfer
    operation: 0, // CALL
    safeTxGas: BigInt(0),
    baseGas: BigInt(0),
    gasPrice: BigInt(0),
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: BigInt(1) // should be fetched from the Safe
  }

  const result = await computeAndProposeTx(
    BigInt(1), // chainId (1 for Ethereum mainnet)
    '0xYourSafeAddress...',
    tx
  )
  console.log('Transaction proposed:', result)
}
```

### Understanding the Hash Computation

The hash computation follows these steps:

1. **Domain Separator**: Creates a unique identifier for the Safe contract on a specific chain
   ```solidity
   keccak256(
     abi.encode(
       keccak256("EIP712Domain(uint256 chainId,address verifyingContract)"),
       chainId,
       address(this)
     )
   )
   ```

2. **Safe Transaction Hash**: Hashes the transaction parameters
   ```solidity
   bytes32 safeTxHash = keccak256(
     abi.encode(
       SAFE_TX_TYPEHASH,
       to,
       value,
       keccak256(data),
       operation,
       safeTxGas,
       baseGas,
       gasPrice,
       gasToken,
       refundReceiver,
       _nonce
     )
   )
   ```

3. **Final Hash**: Combines everything according to EIP-712
   ```solidity
   keccak256(
     abi.encodePacked(
       bytes1(0x19),
       bytes1(0x01),
       domainSeparator,
       safeTxHash
     )
   )
   ```

The viem implementation uses the same logic but with TypeScript types and viem's encoding functions.

## Signing a Transaction

After proposing a transaction, other owners need to sign it. You can add signatures using the `/v1/chains/{chainId}/transactions/{safeTxHash}/confirmations` endpoint.

### Using curl

```bash
curl -X POST "https://safe-client.safe.global/v1/chains/{chainId}/transactions/{safeTxHash}/confirmations" \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "0x..."
  }'
```

### Using JavaScript Fetch with Viem

```typescript
import { type Hash, type Hex, SignatureType } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

interface SignTransactionRequest {
  signature: string;
}

const signTransaction = async (chainId: string, safeTxHash: Hash, signature: Hex) => {
  try {
    const response = await fetch(
      `https://safe-client.safe.global/v1/chains/${chainId}/transactions/${safeTxHash}/confirmations`,
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
};

// Helper function to generate signature
const generateSignature = async (
  privateKey: Hex,
  safeTxHash: Hash
): Promise<Hex> => {
  const account = privateKeyToAccount(privateKey)
  return await account.signMessage({
    message: { raw: safeTxHash }
  }) as Hex
}

// Example usage combining hash computation and signing
const signSafeTransaction = async (
  chainId: bigint,
  safeAddress: string,
  privateKey: Hex,
  transactionData: SafeTransactionData
) => {
  // 1. Calculate the safe transaction hash
  const safeTxHash = await calculateSafeTransactionHash(
    safeAddress,
    chainId,
    transactionData
  )

  // 2. Generate signature
  const signature = await generateSignature(privateKey, safeTxHash)

  // 3. Submit signature
  return await signTransaction(
    chainId.toString(),
    safeTxHash,
    signature
  )
}
```

### Response Structure

```typescript
interface SignatureResponse {
  safeTxHash: Hash;
  signature: Hex;
  sender: AddressInfo;
  confirmationsRequired: number;
  confirmationsSubmitted: number;
  signatures: Array<{
    signer: string;
    signature: string;
    data?: string;
  }>;
}
```

Example response:
```json
{
  "safeTxHash": "0x...",
  "signature": "0x...",
  "sender": {
    "value": "0x...",
    "name": null,
    "logoUri": null
  },
  "confirmationsRequired": 2,
  "confirmationsSubmitted": 2,
  "signatures": [
    {
      "signer": "0x...",
      "signature": "0x..."
    }
  ]
}
```

### Verifying Signatures

You can verify if a transaction has enough signatures before execution:

```typescript
const verifySignatures = async (chainId: string, safeTxHash: Hash) => {
  try {
    const response = await fetch(
      `https://safe-client.safe.global/v1/chains/${chainId}/transactions/${safeTxHash}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const txInfo = await response.json();
    return txInfo.confirmationsSubmitted >= txInfo.confirmationsRequired;
  } catch (error) {
    console.error('Error verifying signatures:', error);
    throw error;
  }
};
```

### Complete Signing Flow Example

```typescript
const completeSigningFlow = async (
  chainId: bigint,
  safeAddress: string,
  privateKey: Hex,
  transactionData: SafeTransactionData
) => {
  // 1. Calculate hash and sign
  const result = await signSafeTransaction(
    chainId,
    safeAddress,
    privateKey,
    transactionData
  );

  // 2. Verify if we have enough signatures
  const readyToExecute = await verifySignatures(
    chainId.toString(),
    result.safeTxHash
  );

  return {
    ...result,
    readyToExecute
  };
};
```

## Executing a Transaction

Once a transaction has collected enough signatures, any address can execute it on-chain. This is done using the Safe contract directly, not through the Safe Client API.

### Using Viem

```typescript
import { createPublicClient, http, createWalletClient, type Hash, type Hex } from 'viem'
import { mainnet } from 'viem/chains'

interface ExecuteTransactionParams {
  to: string
  value: bigint
  data: string
  operation: number
  safeTxGas: bigint
  baseGas: bigint
  gasPrice: bigint
  gasToken: string
  refundReceiver: string
  signatures: string
}

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
}] as const

const executeTransaction = async (
  chainId: bigint,
  safeAddress: string,
  params: ExecuteTransactionParams,
  account: `0x${string}`
) => {
  // 1. Create Viem clients
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http()
  })

  const walletClient = createWalletClient({
    chain: mainnet,
    transport: http()
  })

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
  })

  // 3. Execute transaction
  const hash = await walletClient.writeContract(request)
  
  // 4. Wait for transaction
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  return receipt
}

// Helper function to combine signatures
const combineSignatures = (signatures: Array<{ signer: string, signature: string }>) => {
  // Sort signatures by signer address (required by the Safe contract)
  const sortedSigs = signatures.sort((a, b) => 
    a.signer.toLowerCase().localeCompare(b.signer.toLowerCase())
  )
  
  // Concatenate signatures
  return sortedSigs.map(sig => sig.signature.slice(2)).join('')
}

// Complete execution flow
const completeExecutionFlow = async (
  chainId: bigint,
  safeAddress: string,
  safeTxHash: Hash,
  executorAddress: `0x${string}`
) => {
  try {
    // 1. Get transaction details from Safe Client API
    const response = await fetch(
      `https://safe-client.safe.global/v1/chains/${chainId}/transactions/${safeTxHash}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const txInfo = await response.json()
    
    // 2. Verify enough signatures
    if (txInfo.confirmationsSubmitted < txInfo.confirmationsRequired) {
      throw new Error('Not enough signatures to execute transaction')
    }
    
    // 3. Combine signatures
    const signatures = `0x${combineSignatures(txInfo.signatures)}`
    
    // 4. Execute transaction
    const receipt = await executeTransaction(
      chainId,
      safeAddress,
      {
        ...txInfo.transactionData,
        signatures
      },
      executorAddress
    )
    
    return receipt
  } catch (error) {
    console.error('Error executing transaction:', error)
    throw error
  }
}

// Example usage
const example = async () => {
  const chainId = BigInt(1) // Ethereum mainnet
  const safeAddress = '0xYourSafeAddress...'
  const safeTxHash = '0xYourSafeTxHash...'
  const executorAddress = '0xYourAddress...' // Can be any address

  try {
    const receipt = await completeExecutionFlow(
      chainId,
      safeAddress,
      safeTxHash as Hash,
      executorAddress as `0x${string}`
    )
    
    console.log('Transaction executed:', receipt.transactionHash)
  } catch (error) {
    console.error('Failed to execute transaction:', error)
  }
}
```

### Understanding the Execution Process

1. **Signature Requirements**
   - All required signatures must be collected before execution
   - All signatures must be of type eth_
   - Signatures must be sorted by signer address (ascending order)
   - Anyone can execute the transaction once signatures are collected

2. **Gas Considerations**
   - The executor pays for the gas of the execution transaction
   - If `gasToken` is not zero address, the executor can be refunded in ERC20 tokens
   - `safeTxGas` is the gas limit for the internal transaction

3. **Execution Flow**
   - Verify enough signatures are collected
   - Combine signatures in correct order
   - Submit transaction to the Safe contract
   - Wait for transaction confirmation

4. **Response**
   - The execution returns a transaction receipt
   - Success can be verified through transaction status and events
   - The Safe Client API will eventually reflect the executed status

### Monitoring Execution Status

You can monitor the execution status through the Safe Client API:

```typescript
const monitorExecutionStatus = async (
  chainId: string,
  safeTxHash: Hash,
  maxAttempts = 10,
  intervalMs = 5000
) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `https://safe-client.safe.global/v1/chains/${chainId}/transactions/${safeTxHash}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const txInfo = await response.json()
    
    if (txInfo.txStatus === 'SUCCESS') {
      return txInfo
    } else if (txInfo.txStatus === 'FAILED') {
      throw new Error('Transaction execution failed')
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  
  throw new Error('Timeout waiting for transaction execution')
}
```

This completes the full cycle of Safe transaction management:
1. Proposing a transaction
2. Computing the transaction hash
3. Collecting signatures
4. Executing the transaction
5. Monitoring the execution status