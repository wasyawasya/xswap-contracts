import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('BytesConcatTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const BytesConcatTest = await ethers.getContractFactory('BytesConcatTest');
    const bytesConcatTest = await BytesConcatTest.deploy();

    return {
      bytesConcatTest,
      accounts: { owner, other, another },
    };
  }

  it('Should perform default hash concat of 0 elements', async function () {
    const { bytesConcatTest } = await loadFixture(deployFixture);

    const transaction = await bytesConcatTest.concatHashesDefault(0);
    const receipt = await transaction.wait();
    console.log('Gas used to concat 0 hashes (default):', receipt.gasUsed.toNumber());

    await expect(bytesConcatTest.lastDefaultConcatHash())
      .to.eventually.be.equal('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
  });

  it('Should perform pre-alloc hash concat of 0 elements', async function () {
    const { bytesConcatTest } = await loadFixture(deployFixture);

    const transaction = await bytesConcatTest.concatHashesPreAlloc(0);
    const receipt = await transaction.wait();
    console.log('Gas used to concat 0 hashes (pre-alloc):', receipt.gasUsed.toNumber());

    await expect(bytesConcatTest.lastPreAllocConcatHash())
      .to.eventually.be.equal('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
  });

  it('Should perform default hash concat of 1 element', async function () {
    const { bytesConcatTest } = await loadFixture(deployFixture);

    const transaction = await bytesConcatTest.concatHashesDefault(1);
    const receipt = await transaction.wait();
    console.log('Gas used to concat 1 hash (default):', receipt.gasUsed.toNumber());

    await expect(bytesConcatTest.lastDefaultConcatHash())
      .to.eventually.be.equal('0x510e4e770828ddbf7f7b00ab00a9f6adaf81c0dc9cc85f1f8249c256942d61d9');
  });

  it('Should perform pre-alloc hash concat of 1 element', async function () {
    const { bytesConcatTest } = await loadFixture(deployFixture);

    const transaction = await bytesConcatTest.concatHashesPreAlloc(1);
    const receipt = await transaction.wait();
    console.log('Gas used to concat 1 hash (pre-alloc):', receipt.gasUsed.toNumber());

    await expect(bytesConcatTest.lastPreAllocConcatHash())
      .to.eventually.be.equal('0x510e4e770828ddbf7f7b00ab00a9f6adaf81c0dc9cc85f1f8249c256942d61d9');
  });

  it('Should perform default hash concat of 5 elements', async function () {
    const { bytesConcatTest } = await loadFixture(deployFixture);

    const transaction = await bytesConcatTest.concatHashesDefault(5);
    const receipt = await transaction.wait();
    console.log('Gas used to concat 5 hashes (default):', receipt.gasUsed.toNumber());

    await expect(bytesConcatTest.lastDefaultConcatHash())
      .to.eventually.be.equal('0xe8833dabd12b4f8dbc52b7fe6b7a582d710e9d566d13a3394041c5ce1a5ffb14');
  });

  it('Should perform pre-alloc hash concat of 5 elements', async function () {
    const { bytesConcatTest } = await loadFixture(deployFixture);

    const transaction = await bytesConcatTest.concatHashesPreAlloc(5);
    const receipt = await transaction.wait();
    console.log('Gas used to concat 5 hashes (pre-alloc):', receipt.gasUsed.toNumber());

    await expect(bytesConcatTest.lastPreAllocConcatHash())
      .to.eventually.be.equal('0xe8833dabd12b4f8dbc52b7fe6b7a582d710e9d566d13a3394041c5ce1a5ffb14');
  });

  it('Should perform default hash concat of 123 elements', async function () {
    const { bytesConcatTest } = await loadFixture(deployFixture);

    const transaction = await bytesConcatTest.concatHashesDefault(123);
    const receipt = await transaction.wait();
    console.log('Gas used to concat 123 hashes (default):', receipt.gasUsed.toNumber());

    await expect(bytesConcatTest.lastDefaultConcatHash())
      .to.eventually.be.equal('0x7eb0618735534ae36b87a34081efab1cea8b9b1a30597fd375e84cb7ffbb0c7e');
  });

  it('Should perform pre-alloc hash concat of 123 elements', async function () {
    const { bytesConcatTest } = await loadFixture(deployFixture);

    const transaction = await bytesConcatTest.concatHashesPreAlloc(123);
    const receipt = await transaction.wait();
    console.log('Gas used to concat 123 hashes (pre-alloc):', receipt.gasUsed.toNumber());

    await expect(bytesConcatTest.lastPreAllocConcatHash())
      .to.eventually.be.equal('0x7eb0618735534ae36b87a34081efab1cea8b9b1a30597fd375e84cb7ffbb0c7e');
  });
});
