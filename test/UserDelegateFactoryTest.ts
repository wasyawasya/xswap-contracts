import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('DelegateDeployerTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const DelegateDeployerTest = await ethers.getContractFactory('DelegateDeployerTest');
    const delegateDeployerTest = await DelegateDeployerTest.deploy();

    const delegateDeployerAddress = await delegateDeployerTest.delegateDeployer();
    const DelegateDeployer = await ethers.getContractFactory('DelegateDeployer');
    const delegateDeployer = DelegateDeployer.attach(delegateDeployerAddress);

    const delegateContractFactory = await ethers.getContractFactory('Delegate')

    return { delegateDeployer, delegateContractFactory, owner, other, another };
  }

  it('Should deploy delegate that is owned by account', async function () {
    const { delegateDeployer, delegateContractFactory, other } = await loadFixture(deployFixture);

    const accountAddress = other.address;
    const delegateAddress = await delegateDeployer.predictDelegateDeploy(accountAddress);
    const delegate = delegateContractFactory.attach(delegateAddress);

    const deployDelegateTransaction = await delegateDeployer.deployDelegate(accountAddress);
    const deployDelegateReceipt = await deployDelegateTransaction.wait();
    console.log('Gas used to deploy delegate:', deployDelegateReceipt.gasUsed.toNumber());

    await expect(delegate.owner())
      .to.eventually.be.equal(accountAddress);
  });
});
