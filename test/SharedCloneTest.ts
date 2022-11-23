import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('SharedCloneTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const SharedCloneTest = await ethers.getContractFactory('SharedCloneTest');
    const cloneTest = await SharedCloneTest.deploy();
    const factory = await cloneTest.factory();
    const shared = await cloneTest.shared();

    const SpecificCloner = await ethers.getContractFactory('SpecificCloner');
    const specificCloner = SpecificCloner.attach(factory);

    const specificFactory = await ethers.getContractFactory('Specific');

    return { specificCloner, specificFactory, shared, owner, other, another };
  }

  it('Should clone preserving reference to shared', async function () {
    const { specificCloner, specificFactory, shared } = await loadFixture(deployFixture);

    const salt = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    const specificAddress = await specificCloner.predict(salt);
    await specificCloner.clone(salt);

    const specific = specificFactory.attach(specificAddress);
    const specificShared = await specific.shared();
    expect(specificShared).to.be.equal(shared, 'Unexpected shared address of specific');
  });

  it('Should clone multiple preserving reference to shared', async function () {
    const { specificCloner, specificFactory, shared } = await loadFixture(deployFixture);

    const salt = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    const specificAddress = await specificCloner.predict(salt);
    console.log('Clone predicted address:', specificAddress);
    await specificCloner.clone(salt);

    const salt2 = '0xc0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3';
    const specificAddress2 = await specificCloner.predict(salt2);
    console.log('Clone predicted address 2:', specificAddress2);
    await specificCloner.clone(salt2);

    expect(specificAddress2).to.be.not.equal(specificAddress, 'Unexpected same address for different salts');

    const specific = specificFactory.attach(specificAddress);
    const specificShared = await specific.shared();
    console.log('Clone shared address:', specificShared);
    expect(specificShared).to.be.equal(shared, 'Unexpected shared address of specific');

    const specific2 = specificFactory.attach(specificAddress2);
    const specificShared2 = await specific2.shared();
    console.log('Clone shared address 2:', specificShared2);
    expect(specificShared2).to.be.equal(shared, 'Unexpected shared address of specific');
  });

  it('Should count per clone via shared mapping', async function () {
    const { specificCloner, specificFactory } = await loadFixture(deployFixture);

    const salt = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    const specificAddress = await specificCloner.predict(salt);
    await specificCloner.clone(salt);
    const specific = specificFactory.attach(specificAddress);

    const salt2 = '0xc0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3c0d3';
    const specificAddress2 = await specificCloner.predict(salt2);
    await specificCloner.clone(salt2);
    const specific2 = specificFactory.attach(specificAddress2);

    await expect(specific.getCount())
      .to.eventually.be.equal(0, 'Unexpected init count');
    await expect(specific2.getCount())
      .to.eventually.be.equal(0, 'Unexpected init count 2');

    await specific2.setCount(42);

    await expect(specific.getCount())
      .to.eventually.be.equal(0, 'Unexpected first count');
    await expect(specific2.getCount())
      .to.eventually.be.equal(42, 'Unexpected first count 2');

    await specific.setCount(111);

    await expect(specific.getCount())
      .to.eventually.be.equal(111, 'Unexpected second count');
    await expect(specific2.getCount())
      .to.eventually.be.equal(42, 'Unexpected second count 2');
  });
});
