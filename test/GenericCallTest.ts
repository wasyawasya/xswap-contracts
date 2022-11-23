import { ethers } from 'hardhat';
import { amount } from './common/amount';
import { expect } from 'chai';
import { constants } from 'ethers';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { GenericCall } from '../typechain-types';
import { GenericCallConstructorParamsStruct } from '../typechain-types/calls/GenericCall';

describe('GenericCallTest', function () {
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

    const tokens = {
      a: tokenA,
      b: tokenB,
      c: tokenC,
    };

    // Call mock

    const CallMock = await ethers.getContractFactory('CallMock');
    const callMock = await CallMock.deploy();

    const callMockAmount = await callMock.AMOUNT();
    const tokensToMint = Object.values(tokens).map((t) => t.address);
    await callMock.mint(tokensToMint, { value: callMockAmount });

    // Generic call

    const genericCallParams: GenericCallConstructorParamsStruct = {
      withdrawWhitelist: '0x0101010101010101010101010101010101010101',
    };

    const GenericCall = await ethers.getContractFactory('GenericCall');
    const genericCall = await GenericCall.deploy(genericCallParams);

    return {
      native,
      tokens,
      callMock,
      genericCall,
      accounts: { owner, other, another },
    };
  }

  it('Should perform call: token_a -> token_b', async function () {
    const {
      tokens,
      callMock,
      genericCall,
      accounts,
    } = await loadFixture(deployFixture);
    await tokens.a.mint(accounts.owner.address, amount(100));
    await tokens.a.approve(genericCall.address, amount(100));

    const ownerBalanceBefore = await accounts.owner.getBalance();

    const dexCallData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(90) },
      ],
      [
        { token: tokens.b.address, amount: amount(270) },
      ],
      [],
    ]);

    const callParams: Parameters<GenericCall['call']> = [[
      {
        inToken: tokens.a.address,
        inAmount: amount(100),
        outToken: tokens.b.address,
        outs: [
          { outIndex: 0, amount: constants.MaxUint256 },
        ],
        target: callMock.address,
        data: dexCallData,
      },
    ]];

    const outAmounts = await genericCall.callStatic.call(...callParams);
    expect(outAmounts.length).to.be.equal(1);
    expect(outAmounts[0]).to.be.equal(amount(270));

    const tx = await genericCall.call(...callParams);
    const receipt = await tx.wait();
    const gas = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    await expect(tokens.a.balanceOf(accounts.owner.address))
      .to.eventually.be.equal(amount(10));

    await expect(tokens.b.balanceOf(accounts.owner.address))
      .to.eventually.be.equal(amount(270));

    const ownerBalanceAfter = await accounts.owner.getBalance();
    expect(ownerBalanceBefore).to.be.equal(ownerBalanceAfter.add(gas));
  });

  it('Should perform call: token_a -> token_b + native', async function () {
    const {
      native,
      tokens,
      callMock,
      genericCall,
      accounts,
    } = await loadFixture(deployFixture);
    await tokens.a.mint(accounts.owner.address, amount(100));
    await tokens.a.approve(genericCall.address, amount(100));

    const ownerBalanceBefore = await accounts.owner.getBalance()

    const dexCallData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(90) },
      ],
      [
        { token: tokens.b.address, amount: amount(270) },
      ],
      [],
    ]);

    const gasCallData = callMock.interface.encodeFunctionData('call', [
      [
        { token: tokens.a.address, amount: amount(10) },
      ],
      [
        { token: native, amount: amount(2) },
      ],
      [],
    ]);

    const callParams: Parameters<GenericCall['call']> = [[
      {
        inToken: tokens.a.address,
        inAmount: amount(90),
        outToken: tokens.b.address,
        outs: [
          { outIndex: 0, amount: constants.MaxUint256 },
        ],
        target: callMock.address,
        data: dexCallData,
      },
      {
        inToken: tokens.a.address,
        inAmount: amount(10),
        outToken: native,
        outs: [
          { outIndex: 1, amount: constants.MaxUint256 },
        ],
        target: callMock.address,
        data: gasCallData,
      },
    ]];

    const outAmounts = await genericCall.callStatic.call(...callParams);
    expect(outAmounts.length).to.be.equal(2);
    expect(outAmounts[0]).to.be.equal(amount(270));
    expect(outAmounts[1]).to.be.equal(amount(2));

    const tx = await genericCall.call(...callParams);
    const receipt = await tx.wait();
    const gas = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    await expect(tokens.b.balanceOf(accounts.owner.address))
      .to.eventually.be.equal(amount(270));

    const ownerBalanceAfter = await accounts.owner.getBalance();
    const balanceChange = ownerBalanceAfter.sub(ownerBalanceBefore).add(gas);
    expect(balanceChange).to.be.equal(amount(2));
  });

  it('Should perform call: native -> token_b + native', async function () {
    const {
      native,
      tokens,
      callMock,
      genericCall,
      accounts,
    } = await loadFixture(deployFixture);

    const ownerBalanceBefore = await accounts.owner.getBalance();

    const dexCallData = callMock.interface.encodeFunctionData('call', [
      [
        { token: native, amount: amount(7) },
      ],
      [
        { token: tokens.b.address, amount: amount(270) },
      ],
      [],
    ]);

    const callParams: Parameters<GenericCall['call']> = [
      [
        {
          inToken: native,
          inAmount: amount(1),
          outToken: native,
          outs: [
            { outIndex: 1, amount: amount(1) },
          ],
          target: '0000000000000000000000000000000000000000',
          data: '0x',
        },
        {
          inToken: native,
          inAmount: amount(9),
          outToken: tokens.b.address,
          outs: [
            { outIndex: 0, amount: constants.MaxUint256 },
          ],
          target: callMock.address,
          data: dexCallData,
        },
      ],
      { value: amount(10) },
    ];

    const outAmounts = await genericCall.callStatic.call(...callParams);
    expect(outAmounts.length).to.be.equal(2);
    expect(outAmounts[0]).to.be.equal(amount(270));
    expect(outAmounts[1]).to.be.equal(amount(1));

    const tx = await genericCall.call(...callParams);
    const receipt = await tx.wait();
    const gas = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    await expect(tokens.b.balanceOf(accounts.owner.address))
      .to.eventually.be.equal(amount(270));

    const ownerBalanceAfter = await accounts.owner.getBalance();
    const balanceChange = ownerBalanceAfter.sub(ownerBalanceBefore).add(gas);
    expect(balanceChange).to.be.equal(amount(-7));
  });

  it('Should perform call: native -> multiple natives', async function () {
    const {
      native,
      genericCall,
      accounts,
    } = await loadFixture(deployFixture);

    const ownerBalanceBefore = await accounts.owner.getBalance();

    const callParams: Parameters<GenericCall['call']> = [
      [
        {
          inToken: native,
          inAmount: amount(15),
          outToken: native,
          outs: [
            { outIndex: 2, amount: amount(9) },
            { outIndex: 0, amount: constants.MaxUint256 },
            { outIndex: 1, amount: amount(1) },
            { outIndex: 1, amount: amount(3) },
          ],
          target: '0000000000000000000000000000000000000000',
          data: '0x',
        },
      ],
      { value: amount(15) },
    ];

    const outAmounts = await genericCall.callStatic.call(...callParams);
    expect(outAmounts.length).to.be.equal(3);
    expect(outAmounts[0]).to.be.equal(amount(2));
    expect(outAmounts[1]).to.be.equal(amount(4));
    expect(outAmounts[2]).to.be.equal(amount(9));

    const tx = await genericCall.call(...callParams);
    const receipt = await tx.wait();
    const gas = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    const ownerBalanceAfter = await accounts.owner.getBalance();
    expect(ownerBalanceAfter.add(gas)).to.be.equal(ownerBalanceBefore);
  });
});
