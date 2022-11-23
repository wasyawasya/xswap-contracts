import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BytesLike } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import {
  SwapStruct,
  SwapParamsStruct,
  StealthSwapStruct,
  StealthSwapParamsStruct,
  SwapStepStruct,
  PermitStruct,
  CallStruct,
} from '../typechain-types/core/swap/ISwapper';
import { deadlineHours } from './common/time';
import { createStealthSwapSignature } from './signature/stealthSwap';
import { createSwapSignature, hashSwapStep } from './signature/swap';

/**
 * Constructs example swap structure
 * 
 * The returned struct represents data of the following swap:
 *
 * _Route:_
 *
 * ```txt
 * Polygon/LINK -> [1inch] -> Polygon/USDC -> [Hashflow] -> Binance/USDC -> [1inch] -> Binance/BTCB
 * ```
 *
 * _Gas payments:_
 *
 * - In `Polygon`: Take from output (w/ convert) `Polygon/MATIC`
 * - In `Binance`: Take from input (as-is) `Binance/USDC`
 */
function formateSwap(): SwapStruct {
  const swap: SwapStruct = {
    steps: [
      {
        chain: 137,
        swapper: '0xcC00cc00cC00CC00cc00Cc00CC00Cc00cc00cc00', // Contract address that must process the swap
        account: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF', // Imaginary user address. Validates signature (if signature presented)
        useDelegate: false,
        nonce: 48879, // Imaginary nonce of the user address
        deadline: deadlineHours(1),
        ins: [
          {
            token: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39', // Polygon/LINK
            minAmount: '69832400000000000000', // 69.8324 w/ 18 decimals ($500)
            maxAmount: '69832400000000000000', // 69.8324 w/ 18 decimals ($500)
          },
        ],
        outs: [
          // $480 + $15 = $495 ($500 w/ 1% slippage)
          {
            token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon/USDC
            minAmount: '480000000', // 480 w/ 6 decimals ($480)
            maxAmount: '483000000', // 483 w/ 6 decimals ($483)
          },
          {
            token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native (Polygon/MATIC)
            minAmount: '17647000000000000000', // 17.647 w/ 18 decimals ($15)
            maxAmount: '20000000000000000000', // 20 w/ 18 decimals ($17)
          },
          {
            token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native (Polygon/MATIC)
            minAmount: '0', // 0 ($0)
            maxAmount: '2352940000000000000', // 2.35294 w/ 18 decimals ($2)
          },
        ],
        uses: [
          {
            protocol: '0x08b3De522266B024ddfb78A62F54E85971B48a23', // Imaginary address of Hashflow protocol wrapper
            chain: 56,
            account: '0xEC3E061dEB76a9262adEc7725B715a4119269988', // Imaginary user-owned delegate address
            inIndices: [0, 1], // Polygon/USDC (480-483), Polygon/MATIC (17.647-20)
            outs: [
              // $478.21 ($495 - $2 (max gas) w/ 3% slippage)
              {
                token: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // Binance/USDC
                minAmount: '478210000000000000000', // 478.21 w/ 18 decimals ($478.21)
                maxAmount: '490000000000000000000', // 490 w/ 18 decimals ($490)
              },
            ],
            args: '0x44796E616D6963', // Reserved value ("Dynamic" in ASCII) - expects dynamic args in the hop call
          },
          {
            protocol: '0x1cf2afe82b73a75d39d39fe1b1efcc8c768da050', // Imaginary address of gas payment protocol
            chain: 137,
            account: '0xcC00cc00cC00CC00cc00Cc00CC00Cc00cc00cc00', // Swapper in this network is the gas payer
            inIndices: [2], // Polygon/MATIC (0-2.35294)
            outs: [],
            args: '0x', // Empty args
          },
        ],
      },
      {
        chain: 56,
        swapper: '0x0000cDcD0000CdcD0000CdCd0000CdCD0000Cdcd', // Contract address that must process the swap
        account: '0xC0Dec0dec0DeC0Dec0dEc0DEC0DEC0DEC0DEC0dE', // Imaginary user-owned address (source of delegate address)
        useDelegate: true,
        nonce: 57005, // Imaginary nonce of the user delegate address
        deadline: deadlineHours(1),
        ins: [
          {
            token: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // Binance/USDC
            minAmount: '478210000000000000000', // 478.21 w/ 18 decimals ($478.21)
            maxAmount: '490000000000000000000', // 490 w/ 18 decimals ($490)
          },
        ],
        outs: [
          {
            token: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // Binance/USDC
            minAmount: '0', // 0 ($0)
            maxAmount: '7000000000000000000', // 7 w/ 18 decimals ($7)
          },
          {
            token: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', // Binance/BTCB
            minAmount: '23760000000000000', // 0.02376 w/ 18 decimals ($464.14)
            maxAmount: '24470000000000000', // 0.02447 w/ 18 decimals ($478)
          },
        ],
        uses: [
          {
            protocol: '0xea094724fdd7d3a21e8b5eb3e34411432bcb4846', // Imaginary address of gas payment protocol
            chain: 56,
            account: '0x0000cDcD0000CdcD0000CdCd0000CdCD0000Cdcd', // Swapper in this network is the gas payer
            inIndices: [0], // Binance/USDC (0-7)
            outs: [],
            args: '0x', // Empty args
          },
          {
            protocol: '0xea094724fdd7d3a21e8b5eb3e34411432bcb4846', // Imaginary address of simple transfer protocol
            chain: 56,
            account: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF', // Imaginary target user address
            inIndices: [1], // Binance/BTCB (0.02376-0.02447)
            outs: [
              {
                token: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', // Binance/BTCB
                minAmount: '23760000000000000', // 0.02376 w/ 18 decimals ($464.14)
                maxAmount: '24470000000000000', // 0.02447 w/ 18 decimals ($478)
              },
            ],
            args: '0x', // Empty args
          },
        ],
      },
    ],
  };
  return swap;
}

type SharedSwapParams = {
  swapSignature: BytesLike;
  permits: PermitStruct[];
  inAmounts: string[];
  call: CallStruct;
  useArgs: BytesLike[];
};

function formateSharedSwapParams(): SharedSwapParams {
  const sharedParams: SharedSwapParams = {
    swapSignature: '0x1234567890',
    permits: [
      {
        resolver: '0xF1D348b9576d8024d518325Ccc3129b45Ae3FB6D', // Imaginary permit resolver contract address
        token: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39', // Polygon/LINK
        amount: '125000000000000000000000', // 125k w/ 18 decimals
        deadline: deadlineHours(24),
        signature: (
          '0x4e' +
          '6c01c572e89b3f9c7d868433f27d10da573507c183f64ac6ef94a412dce68f2a' +
          'f5124861163a61bfb0398ee7f0152fc71ad077be3123683039d2f9145a0c173b'
        ),
      },
    ],
    inAmounts: [
      '69832400000000000000',
    ],
    call: {
      target: '0xf6c5e72a303c47a5b86c3e79c8d3ffd96383cc4f',
      data: (
        '0x1054ecb0' +
        '6f979b490109a4972c4d28e706144eaa2452f955efd20227d20553bcb755b0b5' +
        'ef4a4792a62586f689321a0f285f6b827a277db766309aa4b26cc9358e735484' +
        'c9b3188cd48ea485864c019aaa6e88e1dbbcf0e1829dd19e9d293210a8a34610' +
        '81c696213df06237f2f90995413c24004457347f3eb67c40f3ce2e857b1afac0'
      ),
    },
    useArgs: [
      '0x6583fb1aac33b0c2805c24ae07b9c34e8b5d1d12ed471a3c9e03b7cca8f64a2520c69f5831fdb31d4e13', // Some dynamic arg
    ],
  }
  return sharedParams;
}

/**
 * Constructs example swap params structure
 */
function formateSwapParams(): SwapParamsStruct {
  const sharedParams = formateSharedSwapParams();
  const swapParams: SwapParamsStruct = {
    ...sharedParams,
    swap: formateSwap(),
    stepIndex: 0,
  }
  return swapParams;
}

function formateStealthSwap(): StealthSwapStruct {
  const swap = formateSwap();
  const stealthSwap: StealthSwapStruct = {
    chain: swap.steps[0].chain,
    swapper: swap.steps[0].swapper,
    account: swap.steps[0].account,
    stepHashes: swap.steps.map(hashSwapStep),
  };
  return stealthSwap;
};

function formateStealthSwapStep(): SwapStepStruct {
  const swap = formateSwap();
  const step = swap.steps[0];
  return step;
}

function formateStealthSwapParams(): StealthSwapParamsStruct {
  const sharedParams = formateSharedSwapParams();
  const stealthParams: StealthSwapParamsStruct = {
    ...sharedParams,
    swap: formateStealthSwap(),
    step: formateStealthSwapStep(),
  };
  return stealthParams;
}

function flipHexBit(originalHexBytes: string, charToModifyIndex: number): string {
  function flipLastBit(hexChar: string): string {
    return (parseInt(hexChar, 16) ^ 1).toString(16);
  }

  const charToModify = originalHexBytes[charToModifyIndex];
  const modifiedChar = flipLastBit(charToModify);
  const alteredHexBytes = (
    originalHexBytes.slice(0, charToModifyIndex) +
    modifiedChar +
    originalHexBytes.slice(charToModifyIndex + 1)
  );
  return alteredHexBytes;
};

describe('SwapSignatureTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const SwapperMock = await ethers.getContractFactory('SwapperMock');
    const swapperMock = await SwapperMock.deploy();

    const SwapSignatureValidator = await ethers.getContractFactory('SwapSignatureValidator');
    const swapSignatureValidator = await SwapSignatureValidator.deploy();

    return {
      swapperMock,
      swapSignatureValidator,
      accounts: { owner, other, another },
    };
  }

  // Ordinary swap

  it('Should have expected swap structure', async function () {
    const { swapperMock } = await loadFixture(deployFixture);

    const swapParams = formateSwapParams();
    await swapperMock.swap(swapParams);
  });

  it('Should allow valid swap signature', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const swap = formateSwap();
    swap.steps[0].account = accounts.other.address;

    const swapSignature = await createSwapSignature(
      await swap.steps[0].swapper,
      swap,
      accounts.other,
      Number(swap.steps[0].chain),
    );

    await swapSignatureValidator.validateSwapSignature(swap, swapSignature);
  });

  it('Should disallow invalid swap signature - bad bit', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const swap = formateSwap();
    swap.steps[0].account = accounts.other.address;

    const originalSwapSignature = await createSwapSignature(
      await swap.steps[0].swapper,
      swap,
      accounts.other,
      Number(swap.steps[0].chain),
    );

    const swapSignature = flipHexBit(originalSwapSignature, 14);
    console.log(`Original swap signature:  ${originalSwapSignature}`);
    console.log(`Corrupted swap signature: ${swapSignature}`);
    expect(swapSignature).to.be.not.equal(originalSwapSignature);

    await expect(swapSignatureValidator.validateSwapSignature(swap, swapSignature))
      .to.eventually.be.rejected;
  });

  it('Should disallow invalid swap signature - wrong signer', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const swap = formateSwap();
    swap.steps[0].account = accounts.other.address;

    const swapSignature = await createSwapSignature(
      await swap.steps[0].swapper,
      swap,
      accounts.another, // Wrong account, should be 'other'
      Number(swap.steps[0].chain),
    );

    await expect(swapSignatureValidator.validateSwapSignature(swap, swapSignature))
      .to.eventually.be.rejected;
  });

  it('Should disallow invalid swap signature - wrong chain', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const swap = formateSwap();
    swap.steps[0].account = accounts.other.address;

    const swapSignature = await createSwapSignature(
      await swap.steps[0].swapper,
      swap,
      accounts.other,
      9999, // Wrong chain, should be 'swap.steps[0].chain'
    );

    await expect(swapSignatureValidator.validateSwapSignature(swap, swapSignature))
      .to.eventually.be.rejected;
  });

  it('Should disallow invalid swap signature - wrong verifying contract', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const swap = formateSwap();
    swap.steps[0].account = accounts.other.address;

    const swapSignature = await createSwapSignature(
      '0xDd00dD00DD00dD00Dd00Dd00dD00DD00dD00DD00', // Wrong verifying contract, should be 'steps[0].swapper'
      swap,
      accounts.other,
      Number(swap.steps[0].chain),
    );

    await expect(swapSignatureValidator.validateSwapSignature(swap, swapSignature))
      .to.eventually.be.rejected;
  });

  // Stealth swap

  it('Should have expected stealth swap structure', async function () {
    const { swapperMock } = await loadFixture(deployFixture);

    const stealthSwapParams = formateStealthSwapParams();
    await swapperMock.swapStealth(stealthSwapParams);
  });

  it('Should allow valid stealth swap signature', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const stealthSwapStep = formateStealthSwapStep();
    const stealthSwap = formateStealthSwap();
    stealthSwap.account = accounts.other.address;

    const stealthSwapSignature = await createStealthSwapSignature(
      await stealthSwap.swapper,
      stealthSwap,
      accounts.other,
      Number(stealthSwap.chain),
    );

    await swapSignatureValidator.validateStealthSwapStepSignature(stealthSwapStep, stealthSwap, stealthSwapSignature);
  });

  it('Should disallow invalid stealth swap signature - bad bit', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const stealthSwapStep = formateStealthSwapStep();
    const stealthSwap = formateStealthSwap();
    stealthSwap.account = accounts.other.address;

    const originalStealthSwapSignature = await createStealthSwapSignature(
      await stealthSwap.swapper,
      stealthSwap,
      accounts.other,
      Number(stealthSwap.chain),
    );

    const stealthSwapSignature = flipHexBit(originalStealthSwapSignature, 14);
    console.log(`Original stealth swap signature:  ${originalStealthSwapSignature}`);
    console.log(`Corrupted stealth swap signature: ${stealthSwapSignature}`);
    expect(stealthSwapSignature).to.be.not.equal(originalStealthSwapSignature);

    await expect(swapSignatureValidator.validateStealthSwapStepSignature(stealthSwapStep, stealthSwap, stealthSwapSignature))
      .to.eventually.be.rejected;
  });

  it('Should disallow invalid stealth swap signature - wrong signer', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const stealthSwapStep = formateStealthSwapStep();
    const stealthSwap = formateStealthSwap();
    stealthSwap.account = accounts.other.address;

    const stealthSwapSignature = await createStealthSwapSignature(
      await stealthSwap.swapper,
      stealthSwap,
      accounts.another, // Wrong account, should be 'other'
      Number(stealthSwap.chain),
    );

    await expect(swapSignatureValidator.validateStealthSwapStepSignature(stealthSwapStep, stealthSwap, stealthSwapSignature))
      .to.eventually.be.rejected;
  });

  it('Should disallow invalid stealth swap signature - wrong chain', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const stealthSwapStep = formateStealthSwapStep();
    const stealthSwap = formateStealthSwap();
    stealthSwap.account = accounts.other.address;

    const stealthSwapSignature = await createStealthSwapSignature(
      await stealthSwap.swapper,
      stealthSwap,
      accounts.other,
      9999, // Wrong chain, should be 'swap.steps[0].chain'
    );

    await expect(swapSignatureValidator.validateStealthSwapStepSignature(stealthSwapStep, stealthSwap, stealthSwapSignature))
      .to.eventually.be.rejected;
  });

  it('Should disallow invalid stealth swap signature - wrong verifying contract', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const stealthSwapStep = formateStealthSwapStep();
    const stealthSwap = formateStealthSwap();
    stealthSwap.account = accounts.other.address;

    const stealthSwapSignature = await createStealthSwapSignature(
      '0xDd00dD00DD00dD00Dd00Dd00dD00DD00dD00DD00', // Wrong verifying contract, should be 'stealthSwapStep.swapper'
      stealthSwap,
      accounts.other,
      Number(stealthSwap.chain),
    );

    await expect(swapSignatureValidator.validateStealthSwapStepSignature(stealthSwapStep, stealthSwap, stealthSwapSignature))
      .to.eventually.be.rejected;
  });

  it('Should disallow invalid stealth swap signature - no step hash', async function () {
    const { swapSignatureValidator, accounts } = await loadFixture(deployFixture);

    const stealthSwapStep = formateStealthSwapStep();
    const stealthSwap = formateStealthSwap();
    stealthSwap.account = accounts.other.address;

    const originalStepHash = stealthSwap.stepHashes[0].toString();
    const stepHash = flipHexBit(originalStepHash, 37);
    console.log(`Original stealth swap step hash:  ${originalStepHash}`);
    console.log(`Corrupted stealth swap step hash: ${stepHash}`);
    expect(stepHash).to.be.not.equal(originalStepHash);
    stealthSwap.stepHashes[0] = stepHash;

    const stealthSwapSignature = await createStealthSwapSignature(
      await stealthSwap.swapper,
      stealthSwap,
      accounts.other,
      Number(stealthSwap.chain),
    );

    await expect(swapSignatureValidator.validateStealthSwapStepSignature(stealthSwapStep, stealthSwap, stealthSwapSignature))
      .to.eventually.be.rejected;
  });
});
