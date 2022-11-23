import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { reason } from './common/reason';

describe('OwnableAccountWhitelistFactoryTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const OwnableAccountWhitelist = await ethers.getContractFactory('OwnableAccountWhitelist');
    const ownableAccountWhitelistPrototype = await OwnableAccountWhitelist.deploy();

    const OwnableAccountWhitelistFactory = await ethers.getContractFactory('OwnableAccountWhitelistFactory');
    const ownableAccountWhitelistFactory = await OwnableAccountWhitelistFactory.deploy(ownableAccountWhitelistPrototype.address);

    return {
      ownableAccountWhitelistPrototype,
      ownableAccountWhitelistFactory,
      accounts: { owner, other, another },
    };
  }

  it('Should deploy new whitelists owned by caller', async function () {
    const { ownableAccountWhitelistPrototype, ownableAccountWhitelistFactory, accounts } = await loadFixture(deployFixture);
    await expect(ownableAccountWhitelistPrototype.initialized()).to.be.eventually.equal(true);

    const cloneOther1 = await ownableAccountWhitelistFactory.connect(accounts.other).callStatic.deployClone();
    await ownableAccountWhitelistFactory.connect(accounts.other).deployClone();

    const cloneOther2 = await ownableAccountWhitelistFactory.connect(accounts.other).callStatic.deployClone();
    await ownableAccountWhitelistFactory.connect(accounts.other).deployClone();

    const cloneAnother = await ownableAccountWhitelistFactory.connect(accounts.another).callStatic.deployClone();
    await ownableAccountWhitelistFactory.connect(accounts.another).deployClone();

    expect(cloneOther1).to.be.not.equal(cloneOther2);
    expect(cloneOther2).to.be.not.equal(cloneAnother);

    const contractCloneOther1 = await ethers.getContractAt('IOwnableAccountWhitelist', cloneOther1);
    const contractCloneOther2 = await ethers.getContractAt('IOwnableAccountWhitelist', cloneOther2);
    const contractCloneAnother = await ethers.getContractAt('IOwnableAccountWhitelist', cloneAnother);

    await expect(contractCloneOther1.initialized()).to.be.eventually.equal(true);
    await expect(contractCloneOther2.initialized()).to.be.eventually.equal(true);
    await expect(contractCloneAnother.initialized()).to.be.eventually.equal(true);

    await ownableAccountWhitelistPrototype.addAccountToWhitelist('0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF');
    await contractCloneOther2.connect(accounts.other).addAccountToWhitelist('0xC0Dec0dec0DeC0Dec0dEc0DEC0DEC0DEC0DEC0dE');

    await expect(contractCloneAnother.connect(accounts.other).addAccountToWhitelist('0x0123012301230123012301230123012301230123'))
      .to.eventually.be.rejectedWith(reason('OW: caller is not the owner'));
    await contractCloneAnother.connect(accounts.another).transferOwnership(accounts.other.address);
    await contractCloneAnother.connect(accounts.other).addAccountToWhitelist('0x0123012301230123012301230123012301230123');

    {
      const items = await ownableAccountWhitelistPrototype.getWhitelistedAccounts();
      expect(items.length).to.be.equal(1);
      expect(items[0]).to.be.equal('0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF');
    }
    {
      const items = await contractCloneOther1.getWhitelistedAccounts();
      expect(items.length).to.be.equal(0);
    }
    {
      const items = await contractCloneOther2.getWhitelistedAccounts();
      expect(items.length).to.be.equal(1);
      expect(items[0]).to.be.equal('0xC0Dec0dec0DeC0Dec0dEc0DEC0DEC0DEC0DEC0dE');
    }
    {
      const items = await contractCloneAnother.getWhitelistedAccounts();
      expect(items.length).to.be.equal(1);
      expect(items[0]).to.be.equal('0x0123012301230123012301230123012301230123');
    }
  });
});
