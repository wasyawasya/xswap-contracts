import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../../utils/deploy';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type WhitelistDeployOwnableArgs = {
  factory?: string;
  dry: boolean;
  nonce?: string;
};

export const whitelistDeployOwnable = async (
  args: WhitelistDeployOwnableArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy ownable whitelist',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      if (!args.factory) {
        const data = await getDeployContractData({
          contractName: 'OwnableAccountWhitelist',
          constructorParams: [],
          env,
        });
        return { data };
      }

      const factoryContract = await env.ethers.getContractAt('OwnableAccountWhitelistFactory', args.factory);
      const contractAddress = await factoryContract.callStatic.deployClone();
      const data = factoryContract.interface.encodeFunctionData('deployClone');
      return { data, to: args.factory, result: contractAddress };
    },
    nonce: args.nonce,
  });
};
