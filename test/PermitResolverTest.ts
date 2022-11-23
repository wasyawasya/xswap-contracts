import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { amount } from './common/amount';
import { createPermitSignature, TokenPermit } from './signature/permit';
import { createDaiPermitSignature, DaiTokenPermit } from './signature/permitDai';
import { deadlineHours } from './common/time';

describe('PermitResolverTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const PermitResolverTest = await ethers.getContractFactory('PermitResolverTest');
    const permitResolverTest = await PermitResolverTest.deploy();

    return {
      permitResolverTest,
      accounts: { owner, other, another },
    };
  }

  it('Should resolve EIP-2612 permit', async function () {
    const { permitResolverTest, accounts } = await loadFixture(deployFixture);

    // EIP-2612 token mock
    const PermitTokenMock = await ethers.getContractFactory('PermitTokenMock');
    const token = await PermitTokenMock.deploy();

    await token.mint(accounts.other.address, amount(28));

    // EIP-2612 permit resolver
    const PermitResolver = await ethers.getContractFactory('PermitResolver');
    const permitResolver = await PermitResolver.deploy();

    // Sign permit
    const permitAmount = amount(23);
    const permitDeadline = deadlineHours(2);
    const tokenPermit: TokenPermit = {
      owner: accounts.other.address,
      spender: permitResolverTest.address,
      value: permitAmount,
      nonce: 0,
      deadline: permitDeadline,
    };
    const signature = await createPermitSignature(
      token.address,
      'Test Token Domain',
      tokenPermit,
      accounts.other,
    );

    // Resolve permit
    await permitResolverTest.resolvePermit(
      permitResolver.address,
      token.address,
      accounts.other.address,
      permitAmount,
      permitDeadline,
      signature,
    );

    // Target should get allowance
    await expect(token.allowance(accounts.other.address, permitResolverTest.address))
      .to.eventually.be.equal(amount(23));
  });

  it('Should resolve Dai permit', async function () {
    const { permitResolverTest, accounts } = await loadFixture(deployFixture);

    // Dai token mock
    const DaiTokenMock = await ethers.getContractFactory('DaiTokenMock');
    const daiTokenMock = await DaiTokenMock.deploy();
    const daiCreationCode = await daiTokenMock.DAI_CREATION_CODE();
    const daiDeployTransaction = await accounts.owner.sendTransaction({ data: daiCreationCode });
    const daiAddress: string = (daiDeployTransaction as any).creates;
    const dai = await ethers.getContractAt('IDai', daiAddress);
    const daiName = await dai.name();

    await dai.mint(accounts.other.address, amount(28));

    // Dai permit resolver
    const DaiPermitResolver = await ethers.getContractFactory('DaiPermitResolver');
    const daiPermitResolver = await DaiPermitResolver.deploy();

    // Sign permit
    const maxUint256 = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
    const permitAmount = maxUint256;
    const permitDeadline = deadlineHours(2);
    const daiTokenPermit: DaiTokenPermit = {
      holder: accounts.other.address,
      spender: permitResolverTest.address,
      allowed: true,
      nonce: 0,
      expiry: permitDeadline,
    };
    const signature = await createDaiPermitSignature(dai.address, daiName, daiTokenPermit, accounts.other);

    // Resolve permit
    await permitResolverTest.resolvePermit(
      daiPermitResolver.address,
      dai.address,
      accounts.other.address,
      permitAmount,
      permitDeadline,
      signature,
    );

    // Target should get allowance
    await expect(dai.allowance(accounts.other.address, permitResolverTest.address))
      .to.eventually.be.equal(maxUint256);
  });
});
