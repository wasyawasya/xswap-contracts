import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { amount } from './common/amount';

describe('DaiTokenMockTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const daiTokenMockFactory = await ethers.getContractFactory('DaiTokenMock');
    const daiTokenMock = await daiTokenMockFactory.deploy();
    const daiCreationCode = await daiTokenMock.DAI_CREATION_CODE();
    const daiDeployTransaction = await owner.sendTransaction({ data: daiCreationCode });
    const daiAddress: string = (daiDeployTransaction as any).creates;
    const dai = await ethers.getContractAt('IDai', daiAddress);

    return { dai, owner, other, another };
  }

  it('Should perform basic ERC-20 operations', async function () {
    const { dai, other, another } = await loadFixture(deployFixture);

    await expect(dai.balanceOf(other.address))
      .to.eventually.be.equal(amount(0), "Unexpected balance #0");

    await dai.mint(other.address, amount(33));

    await expect(dai.balanceOf(other.address))
      .to.eventually.be.equal(amount(33), "Unexpected balance #1");

    await dai.connect(other).transfer(another.address, amount(11));

    await expect(dai.balanceOf(other.address))
      .to.eventually.be.equal(amount(22), "Unexpected balance #2");
    await expect(dai.balanceOf(another.address))
      .to.eventually.be.equal(amount(11), "Unexpected balance #3");

    await expect(dai.allowance(another.address, other.address))
      .to.eventually.be.equal(amount(0), "Unexpected allowance #0");

    await dai.connect(another).approve(other.address, amount(4));

    await expect(dai.allowance(another.address, other.address))
      .to.eventually.be.equal(amount(4), "Unexpected allowance #1");

    await dai.connect(other).transferFrom(another.address, other.address, amount(3));

    await expect(dai.allowance(another.address, other.address))
      .to.eventually.be.equal(amount(1), "Unexpected allowance #2");
    await expect(dai.balanceOf(other.address))
      .to.eventually.be.equal(amount(25), "Unexpected balance #4");
    await expect(dai.balanceOf(another.address))
      .to.eventually.be.equal(amount(8), "Unexpected balance #5");
  });
});
