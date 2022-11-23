import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';
import 'hardhat-contract-sizer';

const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || '';
const BINANCE_RPC_URL = process.env.BINANCE_RPC_URL || '';
const FANTOM_RPC_URL = process.env.FANTOM_RPC_URL || '';
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || '';
const OPTIMISM_RPC_URL = process.env.OPTIMISM_RPC_URL || '';
const AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL || '';
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL || '';
const GNOSIS_RPC_URL = process.env.GNOSIS_RPC_URL || '';

const ETHEREUM_TEST_RPC_URL = process.env.ETHEREUM_TEST_RPC_URL || '';
const BINANCE_TEST_RPC_URL = process.env.BINANCE_TEST_RPC_URL || '';
const POLYGON_TEST_RPC_URL = process.env.POLYGON_TEST_RPC_URL || '';

const ETHEREUM_EXPLORER_API_KEY = process.env.ETHEREUM_EXPLORER_API_KEY || '';
const BINANCE_EXPLORER_API_KEY = process.env.BINANCE_EXPLORER_API_KEY || '';
const FANTOM_EXPLORER_API_KEY = process.env.FANTOM_EXPLORER_API_KEY || '';
const POLYGON_EXPLORER_API_KEY = process.env.POLYGON_EXPLORER_API_KEY || '';
const OPTIMISM_EXPLORER_API_KEY = process.env.OPTIMISM_EXPLORER_API_KEY || '';
const AVALANCHE_EXPLORER_API_KEY = process.env.AVALANCHE_EXPLORER_API_KEY || '';
const ARBITRUM_EXPLORER_API_KEY = process.env.ARBITRUM_EXPLORER_API_KEY || '';
const GNOSIS_EXPLORER_API_KEY = process.env.GNOSIS_EXPLORER_API_KEY || '';

const EMPTY_PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || EMPTY_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.16',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1_000,
      },
    },
  },
  networks: {
    ethereum: {
      url: ETHEREUM_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    binance: {
      url: BINANCE_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    fantom: {
      url: FANTOM_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    polygon: {
      url: POLYGON_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    optimism: {
      url: OPTIMISM_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    avalanche: {
      url: AVALANCHE_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    arbitrum: {
      url: ARBITRUM_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    gnosis: {
      url: GNOSIS_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    ethereumTest: {
      url: ETHEREUM_TEST_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    binanceTest: {
      url: BINANCE_TEST_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    polygonTest: {
      url: POLYGON_TEST_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHEREUM_EXPLORER_API_KEY,
      bsc: BINANCE_EXPLORER_API_KEY,
      opera: FANTOM_EXPLORER_API_KEY,
      polygon: POLYGON_EXPLORER_API_KEY,
      optimisticEthereum: OPTIMISM_EXPLORER_API_KEY,
      avalanche: AVALANCHE_EXPLORER_API_KEY,
      arbitrumOne: ARBITRUM_EXPLORER_API_KEY,
      gnosis: GNOSIS_EXPLORER_API_KEY,
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: true,
    runOnCompile: true, // Set true to debug contract size changes
    strict: true,
    only: [
      '^contracts/calls',
      '^contracts/core',
      '^contracts/protocols',
      '^contracts/XSwap',
    ],
  },
};

task('x-deployer', 'Prints active deployer account info')
  .setAction(async (args, env) => {
    const { deployerInfo } = await import('./scripts/tasks/deployer/info');
    await deployerInfo(args, env);
  });

task('x-whitelist-deploy-ownable', 'Deploys ownable variant of whitelist')
  .addOptionalParam('factory', 'Ownable account whitelist factory to use')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { whitelistDeployOwnable } = await import('./scripts/tasks/whitelist/deploy/ownable');
    await whitelistDeployOwnable(args, env);
  });

task('x-whitelist-get', 'Gets list of whitelisted accounts')
  .addParam('whitelist', 'Whitelist contract address to remove account from')
  .setAction(async (args, env) => {
    const { whitelistGet } = await import('./scripts/tasks/whitelist/items/get');
    await whitelistGet(args, env);
  });

task('x-whitelist-add', 'Adds account to whitelist')
  .addParam('whitelist', 'Whitelist contract address to add account to')
  .addParam('account', 'Account address to add to whitelist')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { whitelistAdd } = await import('./scripts/tasks/whitelist/items/add');
    await whitelistAdd(args, env);
  });

task('x-whitelist-remove', 'Removes account from whitelist')
  .addParam('whitelist', 'Whitelist contract address to remove account from')
  .addParam('account', 'Account address to remove from whitelist')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { whitelistRemove } = await import('./scripts/tasks/whitelist/items/remove');
    await whitelistRemove(args, env);
  });

task('x-whitelist-deploy-ownable-factory', 'Deploys ownable whitelist factory')
  .addParam('whitelistPrototype', 'Ownable whitelist prototype to produce on factory')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { whitelistDeployOwnableFactory } = await import('./scripts/tasks/whitelist/deploy/ownableFactory');
    await whitelistDeployOwnableFactory(args, env);
  });

task('x-signval-deploy', 'Deploys swap signature validator')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { signatureValidatorDeploy } = await import('./scripts/tasks/signval/deploy');
    await signatureValidatorDeploy(args, env);
  });

task('x-delegate-deploy', 'Deploys delegate')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { delegateDeploy } = await import('./scripts/tasks/delegate/deploy');
    await delegateDeploy(args, env);
  });

task('x-delman-deploy', 'Deploys delegate manager')
  .addParam('delegatePrototype', 'Delegate contract serving as prototype for factory')
  .addParam('withdrawWhitelist', 'Whitelist contract allowing withdraw on delegate manager behalf')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { delegateManagerDeploy } = await import('./scripts/tasks/delman/deploy');
    await delegateManagerDeploy(args, env);
  });

task('x-delman-delegate-predict', 'Predicts delegate deploy address')
  .addParam('manager', 'Delegate manager to use as predictor')
  .addParam('account', 'Account to predict deploy address for')
  .setAction(async (args, env) => {
    const { delegateManagerDelegatePredict } = await import('./scripts/tasks/delman/delegate/predict');
    await delegateManagerDelegatePredict(args, env);
  });

task('x-delman-delegate-deployed', 'Predicts delegate deploy address')
  .addParam('manager', 'Delegate manager to use as checker')
  .addParam('account', 'Account to check deploy for')
  .setAction(async (args, env) => {
    const { delegateManagerDelegateDeployed } = await import('./scripts/tasks/delman/delegate/deployed');
    await delegateManagerDelegateDeployed(args, env);
  });

task('x-delman-delegate-deploy', 'Deploys delegate')
  .addParam('manager', 'Delegate manager to deploy delegate via')
  .addParam('account', 'Account to deploy delegate for')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { delegateManagerDelegateDeploy } = await import('./scripts/tasks/delman/delegate/deploy');
    await delegateManagerDelegateDeploy(args, env);
  });

task('x-delman-delegate-withdraw', 'Withdraws from delegate')
  .addParam('manager', 'Delegate manager to withdraw from delegate via')
  .addParam('account', 'Account to deploy delegate for')
  .addParam('withdrawJson', 'Withdraw operation specification JSON')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { delegateManagerDelegateWithdraw } = await import('./scripts/tasks/delman/delegate/withdraw');
    await delegateManagerDelegateWithdraw(args, env);
  });

task('x-lifecon-deploy', 'Deploys life control')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { lifeControlDeploy } = await import('./scripts/tasks/lifecon/deploy');
    await lifeControlDeploy(args, env);
  });

task('x-lifecon-state', 'Gets life control state')
  .addParam('lifeControl', 'Life control to get state of')
  .setAction(async (args, env) => {
    const { lifeControlGet } = await import('./scripts/tasks/lifecon/state/get');
    await lifeControlGet(args, env);
  });

task('x-lifecon-state-pause', 'Changes life control state to paused')
  .addParam('lifeControl', 'Life control contract address to assign state to')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { lifeControlPause } = await import('./scripts/tasks/lifecon/state/pause');
    await lifeControlPause(args, env);
  });

task('x-lifecon-state-unpause', 'Changes life control state to unpaused')
  .addParam('lifeControl', 'Life control contract address to assign state to')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { lifeControlUnpause } = await import('./scripts/tasks/lifecon/state/unpause');
    await lifeControlUnpause(args, env);
  });

task('x-lifecon-state-terminate', 'Changes life control state to terminated')
  .addParam('lifeControl', 'Life control contract address to assign state to')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { lifeControlTerminate } = await import('./scripts/tasks/lifecon/state/terminate');
    await lifeControlTerminate(args, env);
  });

task('x-permres-deploy', 'Deploys permit resolver')
  .addParam('type', 'Permit resolver type to deploy')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { permitResolverDeploy } = await import('./scripts/tasks/permres/deploy');
    await permitResolverDeploy(args, env);
  });

task('x-xswap-deploy', 'Deploys xSwap')
  .addParam('swapSignatureValidator', 'Swap signature validator contract address')
  .addParam('permitResolverWhitelist', 'Permit resolver whitelist contract address')
  .addParam('useProtocolWhitelist', 'Use protocol contract address')
  .addParam('delegateManager', 'Delegate manager contract address')
  .addParam('withdrawWhitelist', 'Withdraw whitelist contract address')
  .addParam('lifeControl', 'Life control contract address')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { xSwapDeploy } = await import('./scripts/tasks/xswap/deploy');
    await xSwapDeploy(args, env);
  });

task('x-call-generic-deploy', 'Deploys generic call')
  .addParam('withdrawWhitelist', 'Withdraw whitelist contract address')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { callGenericDeploy } = await import('./scripts/tasks/calls/generic/deploy');
    await callGenericDeploy(args, env);
  });

task('x-protocol-transfer-deploy', 'Deploys transfer protocol')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { protocolTransferDeploy } = await import('./scripts/tasks/protocols/transfer/deploy');
    await protocolTransferDeploy(args, env);
  });

task('x-protocol-gasvendor-deploy', 'Deploys gas vendor protocol')
  .addParam('vendor', 'Gas vendor to bind protocol to')
  .addOptionalParam('variant', 'Gas vendor protocol variant (v1 by default)')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { protocolGasVendorDeploy } = await import('./scripts/tasks/protocols/gasvendor/deploy');
    await protocolGasVendorDeploy(args, env);
  });

task('x-protocol-gasvendor-gelato-deploy', 'Deploys Gelato gas vendor protocol')
  .addParam('ops', 'Gelato ops contract address')
  .addParam('relay', 'Gelato relay contract address')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { protocolGasVendorGelatoDeploy } = await import('./scripts/tasks/protocols/gasvendor/gelato/deploy');
    await protocolGasVendorGelatoDeploy(args, env);
  });

task('x-protocol-bridge-cbridge-deploy', 'Deploys cBridge bridge protocol')
  .addParam('cBridge', 'cBridge contract address')
  .addParam('withdrawWhitelist', 'Withdraw whitelist contract address')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { protocolBridgeCBridgeDeploy } = await import('./scripts/tasks/protocols/bridges/cbridge/deploy');
    await protocolBridgeCBridgeDeploy(args, env);
  });

task('x-protocol-bridge-hyphen-deploy', 'Deploys Hyphen bridge protocol')
  .addParam('hyphen', 'Hyphen contract address')
  .addParam('withdrawWhitelist', 'Withdraw whitelist contract address')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { protocolBridgeHyphenDeploy } = await import('./scripts/tasks/protocols/bridges/hyphen/deploy');
    await protocolBridgeHyphenDeploy(args, env);
  });

task('x-withdraw-json', 'Generates withdraw operation JSON for sending tokens to one address')
  .addParam('withdrawable', 'Contract address to generate withdraw JSON for')
  .addParam('tokens', 'Comma-separated list of token addresses to withdraw')
  .addParam('to', 'Address to target withdraws to')
  .setAction(async (args, env) => {
    const { withdrawJson } = await import('./scripts/tasks/withdraw/json');
    await withdrawJson(args, env);
  });

task('x-withdraw-run', 'Withdraws assets from a withdrawable')
  .addParam('withdrawable', 'Contract address to withdraw from')
  .addParam('withdrawJson', 'Withdraw operation specification JSON')
  .addFlag('dry', 'Perform a dry run (estimate only)')
  .addOptionalParam('nonce', 'Nonce override')
  .setAction(async (args, env) => {
    const { withdrawRun } = await import('./scripts/tasks/withdraw/run');
    await withdrawRun(args, env);
  });

export default config;
