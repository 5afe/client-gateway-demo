import { formatEther, parseEther, type Hash } from 'viem';
import { SafeClient, type SafeTransactionData } from './safe-client';
import { privateKeyToAccount } from 'viem/accounts';
import Safe from '@safe-global/protocol-kit';
import { gnosis } from 'viem/chains';
import { parse } from 'path';
import type { MetaTransactionData } from '@safe-global/types-kit';
// Initialize the Safe client
const safeClient = new SafeClient();

// Example workflow
async function exampleWorkflow() {
    if (!process.env.SIGNER_PRIVATE_KEY) {
        throw new Error('SIGNER_PRIVATE_KEY is not set');
    }
    if (!process.env.SAFE_ADDRESS) {
        throw new Error('SAFE_ADDRESS is not set');
    }
    if (!process.env.CHAIN_ID) {
        throw new Error('CHAIN_ID is not set');
    }
    const signer = privateKeyToAccount(process.env.SIGNER_PRIVATE_KEY as `0x${string}`);
    const protocolKit = await Safe.init({
        provider: gnosis.rpcUrls.default.http[0],
        signer: process.env.SIGNER_PRIVATE_KEY,
        safeAddress: process.env.SAFE_ADDRESS,
    })
        // Step 1: Check if chain is supported
        const chainId = process.env.CHAIN_ID; // gnosis
        const isSupported = await safeClient.isChainSupported(chainId);
        if (!isSupported) {
            console.error('Chain not supported');
            return;
        }

        // Step 2: Get Safe information
        const safeAddress = process.env.SAFE_ADDRESS;
        const safeInfo = await safeClient.getSafeInfo(chainId, safeAddress);
        console.log('Safe info:', safeInfo);

        // Step 3: Get transaction history
        const history = await safeClient.getTransactionHistory(chainId, safeAddress);
        console.log('Transaction history count:', history.count);

        // Step 4: Get pending transactions
        const pendingTxs = await safeClient.getPendingTransactions(chainId, safeAddress);
        console.log('Pending transactions count:', pendingTxs.count);

        // Step 5: Create a transaction (ETH transfer example)
        const recipientAddress = '0x000000000000000000000000000000000000dEaD';
        const valueInWei = "1"; // 1 wei

        // Prepare the transaction data
        const txData: MetaTransactionData = {
            to: recipientAddress,
            value: valueInWei,
            data: '0x', // Empty data for ETH transfer
            operation: 0, // Call operation
        };

        let safeTransaction = await protocolKit.createTransaction({
            transactions: [txData]
        })

        // Step 6: Calculate the Safe transaction hash
        const safeTxHash = await protocolKit.getTransactionHash(safeTransaction);

        // Step 7: Sign the transaction with the first owner's private key
        const signature = await protocolKit.signTransaction(safeTransaction);
        // Step 8: Propose the transaction to the Safe
        const proposalData = {
            to: safeTransaction.data.to,
            value: safeTransaction.data.value.toString(),
            data: safeTransaction.data.data,
            nonce: safeTransaction.data.nonce.toString(),
            operation: safeTransaction.data.operation,
            safeTxGas: safeTransaction.data.safeTxGas.toString(),
            baseGas: safeTransaction.data.baseGas.toString(),
            gasPrice: safeTransaction.data.gasPrice.toString(),
            gasToken: safeTransaction.data.gasToken,
            refundReceiver: safeTransaction.data.refundReceiver,
            safeTxHash: safeTxHash as `0x${string}`,
            sender: signer.address, // The sender's address (should match the private key)
            signature: signature.getSignature(signer.address)!.data,
            origin: 'Safe Client Example'
        };
        await safeClient.proposeTransaction(
            chainId,
            safeAddress,
            proposalData
        );

        // Step 9: Other owners sign the transaction
        // This would typically be done by the other owners
        // const otherOwnerPrivateKey = '0xOtherOwnerPrivateKey' as const;
        // const otherOwnerSignature = await safeClient.generateSignature(
        //     otherOwnerPrivateKey,
        //     safeTxHash as `0x${string}`
        // );

        // const signResult = await safeClient.signTransaction(
        //     chainId,
        //     safeTxHash as Hash,
        //     otherOwnerSignature
        // );
        // console.log('Transaction signed:', signResult);

        // Step 10: Verify if we have enough signatures
        const readyToExecute = await safeClient.verifySignatures(chainId, safeTxHash as Hash);

        if (readyToExecute) {
            // Step 11: Get transaction details for execution
            const txResponse = await fetch(
                `https://safe-client.safe.global/v1/chains/${chainId}/transactions/${safeTxHash}`
            );
            const txInfo = await txResponse.json();
            console.log(txInfo.detailedExecutionInfo.confirmations);
            // Combine signatures
            const signatures = safeClient.combineSignatures(txInfo.detailedExecutionInfo.confirmations);

            // Step 12: Execute transaction
            const executeParams = {
                ...proposalData,
                value: BigInt(proposalData.value),
                safeTxGas: BigInt(proposalData.safeTxGas),
                baseGas: BigInt(proposalData.baseGas),
                gasPrice: BigInt(proposalData.gasPrice),
                signatures
            };

            const receipt = await safeClient.executeTransaction(
                gnosis,
                safeAddress,
                executeParams,
                signer // Executor address
            );

            console.log('Transaction executed:', receipt.transactionHash);
        }
}

// Run the example
exampleWorkflow();