import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { DelegateManagerConstructorParamsStruct } from '../typechain-types/core/delegate/DelegateManager';
import { SwapperConstructorParamsStruct, SwapParamsStruct, SwapStruct } from '../typechain-types/core/swap/Swapper';
import { amount } from './common/amount';
import { TEST_CHAIN_ID } from './common/chainId';
import { reason } from './common/reason';
import { deadlineHours } from './common/time';
import { createSwapSignature } from './signature/swap';

describe('SwapperTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    // Tokens

    const TokenHelper = await ethers.getContractFactory('TokenHelper');
    const tokenHelper = await TokenHelper.deploy();
    const native = await tokenHelper.NATIVE_TOKEN();

    const PermitTokenMock = await ethers.getContractFactory('PermitTokenMock');
    const tokenA = await PermitTokenMock.deploy();
    const tokenB = await PermitTokenMock.deploy();
    const tokenC = await PermitTokenMock.deploy();

    const DaiTokenMock = await ethers.getContractFactory('DaiTokenMock');
    const daiTokenMock = await DaiTokenMock.deploy();
    const daiCreationCode = await daiTokenMock.DAI_CREATION_CODE();
    const daiDeployTransaction = await owner.sendTransaction({ data: daiCreationCode });
    const daiAddress: string = (daiDeployTransaction as any).creates;
    const tokenD = await ethers.getContractAt('IDai', daiAddress);

    const tokens = {
      a: tokenA,
      b: tokenB,
      c: tokenC,
      d: tokenD,
    };

    // Call mock

    const CallMock = await ethers.getContractFactory('CallMock');
    const callMock = await CallMock.deploy();

    const callMockAmount = await callMock.AMOUNT();
    const tokensToMint = Object.values(tokens).map((t) => t.address);
    await tokenD.rely(callMock.address);
    await callMock.mint(tokensToMint, { value: callMockAmount });

    // Signature validator

    const SwapSignatureValidator = await ethers.getContractFactory('SwapSignatureValidator');
    const swapSignatureValidator = await SwapSignatureValidator.deploy();

    // Whitelists

    const OwnableAccountWhitelist = await ethers.getContractFactory('OwnableAccountWhitelist');
    const permitResolverWhitelist = await OwnableAccountWhitelist.deploy();
    const useProtocolWhitelist = await OwnableAccountWhitelist.deploy();
    const delegateWithdrawWhitelist = await OwnableAccountWhitelist.deploy();

    // Delegate manager

    const Delegate = await ethers.getContractFactory('Delegate');
    const delegatePrototype = await Delegate.deploy();

    const delegateManagerParams: DelegateManagerConstructorParamsStruct = {
      delegatePrototype: delegatePrototype.address,
      withdrawWhitelist: delegateWithdrawWhitelist.address,
    };

    const DelegateManager = await ethers.getContractFactory('DelegateManager');
    const delegateManager = await DelegateManager.deploy(delegateManagerParams);

    // Swapper

    const swapperParams: SwapperConstructorParamsStruct = {
      swapSignatureValidator: swapSignatureValidator.address,
      permitResolverWhitelist: permitResolverWhitelist.address,
      useProtocolWhitelist: useProtocolWhitelist.address,
      delegateManager: delegateManager.address,
    };

    const Swapper = await ethers.getContractFactory('Swapper');
    const swapper = await Swapper.deploy(swapperParams);
    await delegateWithdrawWhitelist.addAccountToWhitelist(swapper.address);

    // Transfer protocol

    const TransferProtocol = await ethers.getContractFactory('TransferProtocol');
    const transferProtocol = await TransferProtocol.deploy();
    await useProtocolWhitelist.addAccountToWhitelist(transferProtocol.address);

    // Gas protocol

    const GasVendorMock = await ethers.getContractFactory('GasVendorMock');
    const gasVendorMock = await GasVendorMock.deploy();

    const GasVendorProtocol = await ethers.getContractFactory('GasVendorProtocol');
    const gasVendorMockProtocol = await GasVendorProtocol.deploy(gasVendorMock.address);
    await useProtocolWhitelist.addAccountToWhitelist(gasVendorMockProtocol.address);

    return {
      native,
      tokens,
      permitResolverWhitelist,
      useProtocolWhitelist,
      delegateWithdrawWhitelist,
      delegateManager,
      transferProtocol,
      gasVendorMock,
      gasVendorMockProtocol,
      callMock,
      swapper,
      accounts: { owner, other, another },
    };
  }

  it('Should perform swap: steps 1, ins 1, outs 1, uses transfer', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await tokens.a.mint(accounts.other.address, amount(140));
    await tokens.a.connect(accounts.other).approve(swapper.address, amount(140));

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: false,
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(470) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(140),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    const gas = await swapper.estimateGas.swap(swapParams);
    console.log('Gas used for swap (steps 1, ins 1, outs 1, uses transfer):', gas.toNumber());

    await swapper.swap(swapParams);

    await expect(tokens.b.balanceOf(accounts.another.address))
      .to.eventually.be.equal(amount(470));
  });

  it('Should reject swap (nonce already used): steps 1, ins 1, outs 1, uses transfer', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await tokens.a.mint(accounts.other.address, amount(140));
    await tokens.a.connect(accounts.other).approve(swapper.address, amount(140));

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: false,
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(470) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(140),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    await swapper.swap(swapParams);

    await expect(swapper.swap(swapParams))
      .to.eventually.be.rejectedWith(reason('SW: invalid nonce'));
  });

  it('Should reject swap (deadline expired): steps 1, ins 1, outs 1, uses transfer', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await tokens.a.mint(accounts.other.address, amount(140));
    await tokens.a.connect(accounts.other).approve(swapper.address, amount(140));

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: false,
          nonce: 420,
          deadline: deadlineHours(-1), // Deadline expired
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(470) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(140),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    await expect(swapper.swap(swapParams))
      .to.eventually.be.rejectedWith(reason('SW: swap step expired'));
  });

  it('Should reject swap (insufficient call output): steps 1, ins 1, outs 1, uses transfer', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await tokens.a.mint(accounts.other.address, amount(140));
    await tokens.a.connect(accounts.other).approve(swapper.address, amount(140));

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: false,
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(449) }, // Insufficient (450 min)
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(140),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    await expect(swapper.estimateGas.swap(swapParams))
      .to.eventually.be.rejectedWith(reason('TC: insufficient token amount'));
  });

  it('Should reject swap (insufficient call output - by actual balance): steps 1, ins 1, outs 2, uses 2 transfers', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await tokens.a.mint(accounts.other.address, amount(140));
    await tokens.a.connect(accounts.other).approve(swapper.address, amount(140));

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: false,
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
            {
              token: tokens.b.address,
              minAmount: amount(150),
              maxAmount: amount(200),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [1],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(150),
                  maxAmount: amount(200),
                },
              ],
              args: '0x',
            },
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(440) },
        { token: tokens.b.address, amount: amount(175) },
      ],
      [
        { outputIndex: 0, amount: amount(20) },
      ],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(140),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    await expect(swapper.estimateGas.swap(swapParams))
      .to.eventually.be.rejectedWith(reason('SW: insufficient out amount'));
  });

  it('Should perform swap: steps 1, ins 1, outs 2, uses transfer + gas', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      gasVendorMock,
      gasVendorMockProtocol,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await tokens.a.mint(accounts.other.address, amount(140));
    await tokens.a.connect(accounts.other).approve(swapper.address, amount(140));

    await gasVendorMock.setGasFee({
      token: tokens.c.address,
      amount: amount(77),
      collector: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    });

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: false,
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
            {
              token: tokens.c.address,
              minAmount: amount(0),
              maxAmount: amount(100),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
            {
              protocol: gasVendorMockProtocol.address,
              chain: TEST_CHAIN_ID,
              account: swapper.address,
              inIndices: [1],
              outs: [],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(730) },
        { token: tokens.c.address, amount: amount(120) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(140),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    const gas = await swapper.estimateGas.swap(swapParams);
    console.log('Gas used for swap (steps 1, ins 1, outs 2, uses transfer + gas):', gas.toNumber());

    await swapper.swap(swapParams);

    await expect(tokens.b.balanceOf(accounts.another.address))
      .to.eventually.be.equal(amount(500));
    await expect(tokens.b.balanceOf(swapper.address))
      .to.eventually.be.equal(amount(230));

    await expect(tokens.c.balanceOf('0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'))
      .to.eventually.be.equal(amount(77));
  });

  it('Should reject swap (insufficient start allowance): steps 1, ins 1, outs 2, uses transfer + gas', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      gasVendorMock,
      gasVendorMockProtocol,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await tokens.a.mint(accounts.other.address, amount(140));
    await tokens.a.connect(accounts.other).approve(swapper.address, amount(130)); // Not enough

    await gasVendorMock.setGasFee({
      token: tokens.c.address,
      amount: amount(77),
      collector: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    });

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: false,
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
            {
              token: tokens.c.address,
              minAmount: amount(0),
              maxAmount: amount(100),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
            {
              protocol: gasVendorMockProtocol.address,
              chain: TEST_CHAIN_ID,
              account: swapper.address,
              inIndices: [1],
              outs: [],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(730) },
        { token: tokens.c.address, amount: amount(120) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(140),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    await expect(swapper.swap(swapParams))
      .to.eventually.be.rejectedWith(reason('ERC20: insufficient allowance'));
  });

  it('Should reject swap (start token amount less min): steps 1, ins 1, outs 2, uses transfer + gas', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      gasVendorMock,
      gasVendorMockProtocol,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await tokens.a.mint(accounts.other.address, amount(140));
    await tokens.a.connect(accounts.other).approve(swapper.address, amount(140));

    await gasVendorMock.setGasFee({
      token: tokens.c.address,
      amount: amount(77),
      collector: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    });

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: false,
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
            {
              token: tokens.c.address,
              minAmount: amount(0),
              maxAmount: amount(100),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
            {
              protocol: gasVendorMockProtocol.address,
              chain: TEST_CHAIN_ID,
              account: swapper.address,
              inIndices: [1],
              outs: [],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(730) },
        { token: tokens.c.address, amount: amount(120) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(130), // Less min
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    await expect(swapper.swap(swapParams))
      .to.eventually.be.rejectedWith(reason('TC: insufficient token amount'));
  });
  it('Should reject swap (start token amount greater max): steps 1, ins 1, outs 2, uses transfer + gas', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      gasVendorMock,
      gasVendorMockProtocol,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await tokens.a.mint(accounts.other.address, amount(140));
    await tokens.a.connect(accounts.other).approve(swapper.address, amount(140));

    await gasVendorMock.setGasFee({
      token: tokens.c.address,
      amount: amount(77),
      collector: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    });

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: false,
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
            {
              token: tokens.c.address,
              minAmount: amount(0),
              maxAmount: amount(100),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
            {
              protocol: gasVendorMockProtocol.address,
              chain: TEST_CHAIN_ID,
              account: swapper.address,
              inIndices: [1],
              outs: [],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(730) },
        { token: tokens.c.address, amount: amount(120) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(150), // Less min
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    await expect(swapper.swap(swapParams))
      .to.eventually.be.rejectedWith(reason('TC: excessive token amount'));
  });

  it('Should perform swap: steps 1, ins 1 (new delegate), outs 2, uses transfer + gas', async function () {
    const {
      tokens,
      callMock,
      transferProtocol,
      gasVendorMock,
      gasVendorMockProtocol,
      delegateManager,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    const delegateAddressOfOther = await delegateManager.predictDelegateDeploy(accounts.other.address);

    await tokens.a.mint(delegateAddressOfOther, amount(140));

    await gasVendorMock.setGasFee({
      token: tokens.c.address,
      amount: amount(77),
      collector: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    });

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: true, // Will resolve 'accounts.other.address' to 'delegateAddressOfOther'
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: tokens.a.address,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
            {
              token: tokens.c.address,
              minAmount: amount(0),
              maxAmount: amount(100),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
            {
              protocol: gasVendorMockProtocol.address,
              chain: TEST_CHAIN_ID,
              account: swapper.address,
              inIndices: [1],
              outs: [],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(730) },
        { token: tokens.c.address, amount: amount(120) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(140),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    const gas = await swapper.estimateGas.swap(swapParams);
    console.log('Gas used for swap (steps 1, ins 1 (new delegate), outs 2, uses transfer + gas):', gas.toNumber());

    await swapper.swap(swapParams);

    await expect(tokens.b.balanceOf(accounts.another.address))
      .to.eventually.be.equal(amount(500));
    await expect(tokens.b.balanceOf(swapper.address))
      .to.eventually.be.equal(amount(230));

    await expect(tokens.c.balanceOf('0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'))
      .to.eventually.be.equal(amount(77));
  });

  it('Should perform swap: steps 1, ins 1 (existing delegate), outs 2, uses transfer + gas', async function () {
    const {
      native,
      tokens,
      callMock,
      transferProtocol,
      gasVendorMock,
      gasVendorMockProtocol,
      delegateManager,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    await delegateManager.deployDelegate(accounts.other.address);
    const delegateAddressOfOther = await delegateManager.predictDelegateDeploy(accounts.other.address);

    // Ensure delegates can receive native
    await accounts.another.sendTransaction({ to: delegateAddressOfOther, value: amount(140) });

    await gasVendorMock.setGasFee({
      token: native,
      amount: amount(77),
      collector: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    });

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: true, // Will resolve 'accounts.other.address' to 'delegateAddressOfOther'
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: native,
              minAmount: amount(140),
              maxAmount: amount(140),
            },
          ],
          outs: [
            {
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
            {
              token: native,
              minAmount: amount(0),
              maxAmount: amount(100),
            },
          ],
          uses: [
            {
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
            {
              protocol: gasVendorMockProtocol.address,
              chain: TEST_CHAIN_ID,
              account: swapper.address,
              inIndices: [1],
              outs: [],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: native, amount: amount(140) },
      ],
      [
        { token: tokens.b.address, amount: amount(490) },
        { token: native, amount: amount(120) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(140),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    const gas = await swapper.estimateGas.swap(swapParams);
    console.log('Gas used for swap (steps 1, ins 1 (existing delegate), outs 2, uses transfer + gas):', gas.toNumber());

    await swapper.swap(swapParams);

    await expect(tokens.b.balanceOf(accounts.another.address))
      .to.eventually.be.equal(amount(490));

    await expect(ethers.provider.getBalance('0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'))
      .to.eventually.be.equal(amount(77));
  });

  it('Should perform swap: steps 1, ins 6 (new delegate), outs 5, uses 3 transfers + gas + unused', async function () {
    const {
      native,
      tokens,
      callMock,
      transferProtocol,
      gasVendorMock,
      gasVendorMockProtocol,
      delegateManager,
      swapper,
      accounts,
    } = await loadFixture(deployFixture);

    const delegateAddressOfOther = await delegateManager.predictDelegateDeploy(accounts.other.address);

    // Ensure delegates can receive native
    await tokens.a.mint(delegateAddressOfOther, amount(145));
    await tokens.b.mint(delegateAddressOfOther, amount(1040));
    await accounts.another.sendTransaction({ to: delegateAddressOfOther, value: amount(240) });

    await gasVendorMock.setGasFee({
      token: native,
      amount: amount(77),
      collector: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    });

    const swap: SwapStruct = {
      steps: [
        {
          chain: TEST_CHAIN_ID,
          swapper: swapper.address,
          account: accounts.other.address,
          useDelegate: true, // Will resolve 'accounts.other.address' to 'delegateAddressOfOther'
          nonce: 420,
          deadline: deadlineHours(2),
          ins: [
            {
              token: native,
              minAmount: amount(100),
              maxAmount: amount(100),
            },
            {
              token: tokens.b.address,
              minAmount: amount(300),
              maxAmount: amount(300),
            },
            {
              token: tokens.a.address,
              minAmount: amount(130),
              maxAmount: amount(150),
            },
            {
              token: native,
              minAmount: amount(130),
              maxAmount: amount(150),
            },
            {
              token: tokens.b.address,
              minAmount: amount(340),
              maxAmount: amount(400),
            },
            {
              token: tokens.b.address,
              minAmount: amount(340),
              maxAmount: amount(400),
            },
          ],
          outs: [
            {
              // Transfer #1
              token: tokens.b.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
            {
              // Gas
              token: native,
              minAmount: amount(0),
              maxAmount: amount(100),
            },
            {
              // Transfer #3
              token: tokens.a.address,
              minAmount: amount(110),
              maxAmount: amount(160),
            },
            {
              // Transfer #2
              token: tokens.a.address,
              minAmount: amount(450),
              maxAmount: amount(500),
            },
            {
              // Unused
              token: native,
              minAmount: amount(50),
              maxAmount: amount(100),
            },
          ],
          uses: [
            {
              // Transfer #1
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: accounts.another.address,
              inIndices: [0],
              outs: [
                {
                  token: tokens.b.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
            {
              // Gas
              protocol: gasVendorMockProtocol.address,
              chain: TEST_CHAIN_ID,
              account: swapper.address,
              inIndices: [1],
              outs: [],
              args: '0x',
            },
            {
              // Transfer #2
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: '0xBEeFbeefbEefbeEFbeEfbEEfBEeFbeEfBeEfBeef',
              inIndices: [3],
              outs: [
                {
                  token: tokens.a.address,
                  minAmount: amount(450),
                  maxAmount: amount(500),
                },
              ],
              args: '0x',
            },
            {
              // Transfer #3
              protocol: transferProtocol.address,
              chain: TEST_CHAIN_ID,
              account: '0xc0D3c0D3c0d3c0d3C0D3c0D3C0D3C0d3C0d3C0d3',
              inIndices: [2],
              outs: [
                {
                  token: tokens.a.address,
                  minAmount: amount(110),
                  maxAmount: amount(160),
                },
              ],
              args: '0x',
            },
          ],
        },
      ],
    };
    const swapSignature = await createSwapSignature(swapper.address, swap, accounts.other);

    const callData = callMock.interface.encodeFunctionData('call', [
      [
        { token: native, amount: amount(240) },
        { token: tokens.a.address, amount: amount(145) },
        { token: tokens.b.address, amount: amount(1040) },
      ],
      [
        { token: tokens.b.address, amount: amount(450) },
        { token: native, amount: amount(87) },
        { token: tokens.a.address, amount: amount(110) },
        { token: tokens.a.address, amount: amount(500) },
        { token: native, amount: amount(55) },
      ],
      [],
    ]);

    const swapParams: SwapParamsStruct = {
      swap,
      swapSignature,
      stepIndex: 0,
      permits: [],
      inAmounts: [
        amount(100),
        amount(300),
        amount(145),
        amount(140),
        amount(340),
        amount(400),
      ],
      call: {
        target: callMock.address,
        data: callData,
      },
      useArgs: [],
    };

    const gas = await swapper.estimateGas.swap(swapParams);
    console.log('Gas used for swap (steps 1, ins 6 (new delegate), outs 5, uses 3 transfers + gas + unused):', gas.toNumber());

    await swapper.swap(swapParams);

    await expect(tokens.b.balanceOf(accounts.another.address))
      .to.eventually.be.equal(amount(450));
    await expect(tokens.a.balanceOf('0xc0D3c0D3c0d3c0d3C0D3c0D3C0D3C0d3C0d3C0d3'))
      .to.eventually.be.equal(amount(110));
    await expect(tokens.a.balanceOf('0xBEeFbeefbEefbeEFbeEfbEEfBEeFbeEfBeEfBeef'))
      .to.eventually.be.equal(amount(500));
    await expect(ethers.provider.getBalance('0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'))
      .to.eventually.be.equal(amount(77));

    await expect(ethers.provider.getBalance(swapper.address))
      .to.eventually.be.equal(amount(65));
  });
});
