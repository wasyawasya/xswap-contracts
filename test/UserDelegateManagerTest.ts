import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { amount } from './common/amount';

describe('DelegateManagerTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const DelegateManagerTest = await ethers.getContractFactory('DelegateManagerTest');
    const delegateManagerTest = await DelegateManagerTest.deploy();

    const delegateManagerAddress = await delegateManagerTest.delegateManager();
    const DelegateManager = await ethers.getContractFactory('DelegateManager');
    const delegateManager = DelegateManager.attach(delegateManagerAddress);

    const delegateContractFactory = await ethers.getContractFactory('Delegate')

    const TokenHelper = await ethers.getContractFactory('TokenHelper');
    const tokenHelper = await TokenHelper.deploy();
    const nativeToken = await tokenHelper.NATIVE_TOKEN();

    return {
      delegateManagerTest,
      delegateManager,
      delegateContractFactory,
      nativeToken,
      owner, other, another,
    };
  }

  it('Should be withdrawable by delegate owner or manager whitelist', async function () {
    const {
      delegateManagerTest,
      delegateManager,
      delegateContractFactory,
      nativeToken,
      owner, other, another,
    } = await loadFixture(deployFixture);

    const delegateAddress = await delegateManager.predictDelegateDeploy(other.address);

    // We send transaction before the contract with the address exists
    await another.sendTransaction({ to: delegateAddress, value: amount(42) });
    await expect(ethers.provider.getBalance(delegateAddress))
      .to.eventually.be.equal(amount(42), 'Unexpected early delegate balance');

    // Check delegate balance after deploy
    await delegateManager.deployDelegate(other.address);
    await expect(ethers.provider.getBalance(delegateAddress))
      .to.eventually.be.equal(amount(42), 'Unexpected deployed delegate balance');

    // Ensure account is the delegate owner
    const delegate = delegateContractFactory.attach(delegateAddress);
    await expect(delegate.owner())
      .to.eventually.be.equal(other.address);

    // Non-owner cannot withdraw
    const receiverAddress = '0xDeadc0dedeAdc0DEDeaDc0deDeADc0DedEadc0De';
    await expect(delegate.withdraw([{ token: nativeToken, amount: amount(11), to: receiverAddress }]))
      .to.eventually.be.rejected;

    await expect(ethers.provider.getBalance(delegateAddress))
      .to.eventually.be.equal(amount(42), 'Unexpected delegate balance after fail');

    // Owner can withdraw
    await delegate.connect(other).withdraw([{ token: nativeToken, amount: amount(7), to: receiverAddress }]);
    await expect(ethers.provider.getBalance(delegateAddress))
      .to.eventually.be.equal(amount(35), 'Unexpected delegate balance after withdraw');
    await expect(ethers.provider.getBalance(receiverAddress))
      .to.eventually.be.equal(amount(7), 'Unexpected receiver balance after withdraw');

    // Manager cannot withdraw when called by non-whitelisted 'owner'
    await expect(delegateManager.withdraw(other.address, [{ token: nativeToken, amount: amount(13), to: receiverAddress }]))
      .to.eventually.be.rejected;

    await expect(ethers.provider.getBalance(delegateAddress))
      .to.eventually.be.equal(amount(35), 'Unexpected delegate balance after fail 2');

    await delegateManagerTest.addToWithdrawWhitelist(owner.address);

    // Manager can withdraw when called by whitelisted 'owner'
    await delegateManager.withdraw(other.address, [{ token: nativeToken, amount: amount(13), to: receiverAddress }]);
    await expect(ethers.provider.getBalance(delegateAddress))
      .to.eventually.be.equal(amount(22), 'Unexpected delegate balance after withdraw 2');
    await expect(ethers.provider.getBalance(receiverAddress))
      .to.eventually.be.equal(amount(20), 'Unexpected receiver balance after withdraw 2');
  });

  it('Should correctly detect delegate deploy state', async function () {
    const { delegateManager, another } = await loadFixture(deployFixture);

    await expect(delegateManager.isDelegateDeployed('0x0123456701234567012345670123456701234567'))
      .to.eventually.be.equal(false);

    const delegateAddress = await delegateManager.predictDelegateDeploy('0x0123456701234567012345670123456701234567');

    const PermitTokenMock = await ethers.getContractFactory('PermitTokenMock');
    const token = await PermitTokenMock.deploy();
    await token.mint(delegateAddress, amount(123));

    await expect(delegateManager.isDelegateDeployed('0x0123456701234567012345670123456701234567'))
      .to.eventually.be.equal(false);

    await another.sendTransaction({ to: delegateAddress, value: amount(42) });

    await expect(delegateManager.isDelegateDeployed('0x0123456701234567012345670123456701234567'))
      .to.eventually.be.equal(false);

    await delegateManager.deployDelegate('0x0123456701234567012345670123456701234567');

    await expect(delegateManager.isDelegateDeployed('0x0123456701234567012345670123456701234567'))
      .to.eventually.be.equal(true);
  });
});
