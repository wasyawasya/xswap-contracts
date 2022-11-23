import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('NonceTypeTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const NonceTypeTest = await ethers.getContractFactory('NonceTypeTest');
    const nonceTypeTest = await NonceTypeTest.deploy();

    return {
      nonceTypeTest,
      accounts: { owner, other, another },
    };
  }

  it('Should use 1 double map nonce', async function () {
    const { nonceTypeTest, accounts } = await loadFixture(deployFixture);

    const nonces = [...Array(1).keys()];
    const transaction = await nonceTypeTest.useDoubleMapNonces(nonces);
    const receipt = await transaction.wait();
    console.log('Gas used to use 1 double map nonce:', receipt.gasUsed.toNumber());

    await expect(nonceTypeTest.useDoubleMapNonces([nonces[0]]))
      .to.eventually.be.rejected;

    await nonceTypeTest.connect(accounts.other).useDoubleMapNonces(nonces);
    await expect(nonceTypeTest.connect(accounts.other).useDoubleMapNonces([nonces[0]]))
      .to.eventually.be.rejected;
  });

  it('Should use 1 single hash map nonce', async function () {
    const { nonceTypeTest, accounts } = await loadFixture(deployFixture);

    const nonces = [...Array(1).keys()];
    const transaction = await nonceTypeTest.useSingleHashNonces(nonces);
    const receipt = await transaction.wait();
    console.log('Gas used to use 1 single hash map nonce:', receipt.gasUsed.toNumber());

    await expect(nonceTypeTest.useSingleHashNonces([nonces[0]]))
      .to.eventually.be.rejected;

    await nonceTypeTest.connect(accounts.other).useSingleHashNonces(nonces);
    await expect(nonceTypeTest.connect(accounts.other).useSingleHashNonces([nonces[0]]))
      .to.eventually.be.rejected;
  });

  it('Should use 1 slot hash map nonce', async function () {
    const { nonceTypeTest, accounts } = await loadFixture(deployFixture);

    const nonces = [...Array(1).keys()];
    const transaction = await nonceTypeTest.useSlotHashNonces(nonces);
    const receipt = await transaction.wait();
    console.log('Gas used to use 1 slot hash map nonce:', receipt.gasUsed.toNumber());

    await expect(nonceTypeTest.useSlotHashNonces([nonces[0]]))
      .to.eventually.be.rejected;

    await nonceTypeTest.connect(accounts.other).useSlotHashNonces(nonces);
    await expect(nonceTypeTest.connect(accounts.other).useSlotHashNonces([nonces[0]]))
      .to.eventually.be.rejected;
  });

  it('Should use 3 double map nonces', async function () {
    const { nonceTypeTest, accounts } = await loadFixture(deployFixture);

    const nonces = [...Array(3).keys()];
    const transaction = await nonceTypeTest.useDoubleMapNonces(nonces);
    const receipt = await transaction.wait();
    console.log('Gas used to use 3 double map nonces:', receipt.gasUsed.toNumber());

    await expect(nonceTypeTest.useDoubleMapNonces([nonces[0]]))
      .to.eventually.be.rejected;

    await nonceTypeTest.connect(accounts.other).useDoubleMapNonces(nonces);
    await expect(nonceTypeTest.connect(accounts.other).useDoubleMapNonces([nonces[0]]))
      .to.eventually.be.rejected;
  });

  it('Should use 3 single hash map nonces', async function () {
    const { nonceTypeTest, accounts } = await loadFixture(deployFixture);

    const nonces = [...Array(3).keys()];
    const transaction = await nonceTypeTest.useSingleHashNonces(nonces);
    const receipt = await transaction.wait();
    console.log('Gas used to use 3 single hash map nonces:', receipt.gasUsed.toNumber());

    await expect(nonceTypeTest.useSingleHashNonces([nonces[0]]))
      .to.eventually.be.rejected;

    await nonceTypeTest.connect(accounts.other).useSingleHashNonces(nonces);
    await expect(nonceTypeTest.connect(accounts.other).useSingleHashNonces([nonces[0]]))
      .to.eventually.be.rejected;
  });

  it('Should use 3 slot hash map nonces', async function () {
    const { nonceTypeTest, accounts } = await loadFixture(deployFixture);

    const nonces = [...Array(3).keys()];
    const transaction = await nonceTypeTest.useSlotHashNonces(nonces);
    const receipt = await transaction.wait();
    console.log('Gas used to use 3 slot hash map nonces:', receipt.gasUsed.toNumber());

    await expect(nonceTypeTest.useSlotHashNonces([nonces[0]]))
      .to.eventually.be.rejected;

    await nonceTypeTest.connect(accounts.other).useSlotHashNonces(nonces);
    await expect(nonceTypeTest.connect(accounts.other).useSlotHashNonces([nonces[0]]))
      .to.eventually.be.rejected;
  });

  it('Should use 17 double map nonces', async function () {
    const { nonceTypeTest, accounts } = await loadFixture(deployFixture);

    const nonces = [...Array(17).keys()];
    const transaction = await nonceTypeTest.useDoubleMapNonces(nonces);
    const receipt = await transaction.wait();
    console.log('Gas used to use 17 double map nonces:', receipt.gasUsed.toNumber());

    await expect(nonceTypeTest.useDoubleMapNonces([nonces[0]]))
      .to.eventually.be.rejected;

    await nonceTypeTest.connect(accounts.other).useDoubleMapNonces(nonces);
    await expect(nonceTypeTest.connect(accounts.other).useDoubleMapNonces([nonces[0]]))
      .to.eventually.be.rejected;
  });

  it('Should use 17 single hash map nonces', async function () {
    const { nonceTypeTest, accounts } = await loadFixture(deployFixture);

    const nonces = [...Array(17).keys()];
    const transaction = await nonceTypeTest.useSingleHashNonces(nonces);
    const receipt = await transaction.wait();
    console.log('Gas used to use 17 single hash map nonces:', receipt.gasUsed.toNumber());

    await expect(nonceTypeTest.useSingleHashNonces([nonces[0]]))
      .to.eventually.be.rejected;

    await nonceTypeTest.connect(accounts.other).useSingleHashNonces(nonces);
    await expect(nonceTypeTest.connect(accounts.other).useSingleHashNonces([nonces[0]]))
      .to.eventually.be.rejected;
  });

  it('Should use 17 slot hash map nonces', async function () {
    const { nonceTypeTest, accounts } = await loadFixture(deployFixture);

    const nonces = [...Array(17).keys()];
    const transaction = await nonceTypeTest.useSlotHashNonces(nonces);
    const receipt = await transaction.wait();
    console.log('Gas used to use 17 slot hash map nonces:', receipt.gasUsed.toNumber());

    await expect(nonceTypeTest.useSlotHashNonces([nonces[0]]))
      .to.eventually.be.rejected;

    await nonceTypeTest.connect(accounts.other).useSlotHashNonces(nonces);
    await expect(nonceTypeTest.connect(accounts.other).useSlotHashNonces([nonces[0]]))
      .to.eventually.be.rejected;
  });
});
