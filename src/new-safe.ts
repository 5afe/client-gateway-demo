import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import Safe from '@safe-global/protocol-kit';
import { http, createWalletClient, defineChain, publicActions } from 'viem';
import { gnosis } from 'viem/chains';
// Example workflow

// -> create you own chain for lens ZK
// export const zora = defineChain({
//     id: 100,
//     name: 'gnosis',
//     nativeCurrency: {
//         decimals: 18,
//         name: 'Xdai',
//         symbol: 'xdai',
//     },
//     rpcUrls: {
//         default: {
//             http: ['https://rpc.zora.energy'],
//             webSocket: ['wss://rpc.zora.energy'],
//         },
//     },
//     blockExplorers: {
//         default: { name: 'Explorer', url: 'https://explorer.zora.energy' },
//     },
//     contracts: {
//         multicall3: {
//             address: '0xcA11bde05977b3631167028862bE2a173976CA11',
//             blockCreated: 5882,
//         },
//     },
// })

async function exampleWorkflow() {
    if (!process.env.SIGNER_PRIVATE_KEY) {
        throw new Error('SIGNER_PRIVATE_KEY is not set');
    }
    if (!process.env.RPC_URL) {
        throw new Error('RPC_URL is not set');
    }
    const owner1 = privateKeyToAccount(process.env.SIGNER_PRIVATE_KEY as `0x${string}`);
    const client = createWalletClient({
        account: owner1,
        transport: http(process.env.RPC_URL),
        chain: gnosis
    }).extend(publicActions)
    const randomAddress = privateKeyToAccount(generatePrivateKey()).address

    const protocolKit = await Safe.init({
        provider: process.env.RPC_URL,
        signer: process.env.SIGNER_PRIVATE_KEY,
        predictedSafe: {
            safeAccountConfig: {
                owners: [randomAddress],
                threshold: 1,
            },
        }
    })
    const safeAddress = await protocolKit.getAddress()

    const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()

    const transactionHash = await client.sendTransaction({
        to: deploymentTransaction.to,
        value: BigInt(deploymentTransaction.value),
        data: deploymentTransaction.data as `0x${string}`,
    })

    const transactionReceipt = await client.waitForTransactionReceipt({
        hash: transactionHash
    })
    if (transactionReceipt.status !== 'success') {
        throw new Error('Transaction failed')
    }
    console.log('transactionHash', transactionHash)

    const newProtocolKit = await protocolKit.connect({
        safeAddress
    })

    const isSafeDeployed = await newProtocolKit.isSafeDeployed() // True
    const safeOwners = await newProtocolKit.getOwners()
    const safeThreshold = await newProtocolKit.getThreshold()
    console.log(isSafeDeployed, safeOwners, safeThreshold)
}

// Run the example
exampleWorkflow();