import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('AccountCounterTest', function () {
  async function deployFixture() {
    const [owner, other, another] = await ethers.getSigners();

    const AccountCounterTest = await ethers.getContractFactory('AccountCounterTest');
    const accountCounterTest = await AccountCounterTest.deploy();

    return {
      accountCounterTest,
      accounts: { owner, other, another },
    };
  }

  it('Should pass account counting for 2 accounts', async function () {
    const { accountCounterTest } = await loadFixture(deployFixture);

    const accounts = [
        '0x715B2f0EFE91Aa7a223E9F8A6dcd699E8Eb3CA67',
        '0x0C74B021c6e0e7A225b197e76bb14Cf6850507c9',
    ];

    const gas = await accountCounterTest.testAccountCounter(accounts, 0, 1);
    console.log('Gas used for account counting (2 accounts):', gas.toNumber());
  });

  it('Should pass account counting for 3 accounts', async function () {
    const { accountCounterTest } = await loadFixture(deployFixture);

    const accounts = [
        '0x715B2f0EFE91Aa7a223E9F8A6dcd699E8Eb3CA67',
        '0xd17b581a3c0F241C2136905323E9EC9c48D326D4',
        '0x025513d9203c5749bb4407Fc79Fb656Bd5E2f6A4',
    ];

    const gas = await accountCounterTest.testAccountCounter(accounts, 0, 2);
    console.log('Gas used for account counting (3 accounts):', gas.toNumber());
  });

  it('Should pass account counting for 5 accounts', async function () {
    const { accountCounterTest } = await loadFixture(deployFixture);

    const accounts = [
        '0x715B2f0EFE91Aa7a223E9F8A6dcd699E8Eb3CA67',
        '0xd17b581a3c0F241C2136905323E9EC9c48D326D4',
        '0x025513d9203c5749bb4407Fc79Fb656Bd5E2f6A4',
        '0xD6BaA36257A09071490f894Cda8c2bd8b542C7eF',
        '0xDbdbE62c7E2A8909c3CC343fa51c57b14E21235f',
    ];

    const gas = await accountCounterTest.testAccountCounter(accounts, 0, 3);
    console.log('Gas used for account counting (5 accounts):', gas.toNumber());
  });

  it('Should pass account counting for 17 accounts', async function () {
    const { accountCounterTest } = await loadFixture(deployFixture);

    const accounts = [
        '0xC7b9C297A88e6424E059F8E05f64756997D96418',
        '0xBBB6fa262103C8f2325aCb50506494c8bD847FfB',
        '0x52f469Ba6053d8aa717B394F56A9d86F6afC2B48',
        '0xB62CeE29562d469d87888a30ea3f87DDF1118e3c',
        '0xDbdbE62c7E2A8909c3CC343fa51c57b14E21235f',
        '0x0e7faBa75980E9043Cb43f1DD451667298459e2b',
        '0xcFc989b8E7Da22a82339DC525E4a90c20A4d1185',
        '0xC22691105AB611a4f8836dE4Da2BE1F1dbc9eA5D',
        '0x959624569c2deF4e8360244B0197b35D1375F9Ef',
        '0xD6BaA36257A09071490f894Cda8c2bd8b542C7eF',
        '0x1456F6412772Fcc84181DAf90524D0eF32c98807',
        '0x47A1Cd850F2d0497A479fba28cC132F864dE27E7',
        '0x6e07AdE68Db4F4183A34e6456CC01647A0033a79',
        '0x7b4581EFb61Fa4fe8f7c13477F12448A3D531E2E',
        '0x51c4B24cC34Bf8dBe4e4d4dd1239DFB2B559D979',
        '0x57D4C26E86047d676Bac0b9a682e5a9325Ac3C8A',
        '0xA5C2E31a4810F65332BA71B70ece7F76B2B19428',
    ];

    const gas = await accountCounterTest.testAccountCounter(accounts, 3, 12);
    console.log('Gas used for account counting (17 accounts):', gas.toNumber());
  });
});
