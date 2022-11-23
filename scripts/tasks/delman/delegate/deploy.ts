import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IDelegateManager } from '../../../../typechain-types';
import { attachContract } from '../../../utils/attach';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type DelegateManagerDelegateDeployArgs = {
  manager: string;
  account: string;
  dry: boolean;
  nonce?: string;
};

export const delegateManagerDelegateDeploy = async (
  args: DelegateManagerDelegateDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy delegate manager delegate',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const delegateManager = await attachContract<IDelegateManager>({
        contractName: 'IDelegateManager',
        contractAddress: args.manager,
        env,
      });
      const data = delegateManager.interface.encodeFunctionData(
        'deployDelegate',
        [args.account],
      );
      return { data, to: delegateManager.address };
    },
    nonce: args.nonce,
  });
};
