import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ILifeControl } from '../../../../typechain-types';
import { attachContract } from '../../../utils/attach';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type LifeControlGetArgs = {
  lifeControl: string;
};

export const lifeControlGet = async (
  args: LifeControlGetArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Get life control state',
    env,
    mode: 'read',
    transaction: async () => {
      const accountWhitelist = await attachContract<ILifeControl>({
        contractName: 'ILifeControl',
        contractAddress: args.lifeControl,
        env,
      });
      const [paused, terminated] = await Promise.all([
        accountWhitelist.paused(),
        accountWhitelist.terminated(),
      ]);
      return { result: { paused, terminated } };
    },
  });
};
