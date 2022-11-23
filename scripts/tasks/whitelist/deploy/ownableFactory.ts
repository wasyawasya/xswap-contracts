import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../../utils/deploy';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type WhitelistDeployOwnableFactoryArgs = {
  whitelistPrototype: string;
  dry: boolean;
  nonce?: string;
};

export const whitelistDeployOwnableFactory = async (
  args: WhitelistDeployOwnableFactoryArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy ownable whitelist factory',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'OwnableAccountWhitelistFactory',
        constructorParams: [args.whitelistPrototype],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
