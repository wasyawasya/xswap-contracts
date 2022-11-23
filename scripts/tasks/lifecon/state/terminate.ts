import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ILifeControl } from '../../../../typechain-types';
import { attachContract } from '../../../utils/attach';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type TerminateArgs = {
  lifeControl: string;
  dry: boolean;
  nonce?: string;
};

export const lifeControlTerminate = async (
  args: TerminateArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Changes life control state to terminated',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const accountWhitelist = await attachContract<ILifeControl>({
        contractName: 'ILifeControl',
        contractAddress: args.lifeControl,
        env,
      });
      const data = accountWhitelist.interface.encodeFunctionData('terminate');
      return { data, to: accountWhitelist.address };
    },
    nonce: args.nonce,
  });
};
