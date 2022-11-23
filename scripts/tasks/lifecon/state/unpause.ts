import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ILifeControl } from '../../../../typechain-types';
import { attachContract } from '../../../utils/attach';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type UnpauseArgs = {
  lifeControl: string;
  dry: boolean;
  nonce?: string;
};

export const lifeControlUnpause = async (
  args: UnpauseArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Changes life control state to unpaused',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const accountWhitelist = await attachContract<ILifeControl>({
        contractName: 'ILifeControl',
        contractAddress: args.lifeControl,
        env,
      });
      const data = accountWhitelist.interface.encodeFunctionData('unpause');
      return { data, to: accountWhitelist.address };
    },
    nonce: args.nonce,
  });
};
