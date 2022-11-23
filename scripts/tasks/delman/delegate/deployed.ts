import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IDelegateManager } from '../../../../typechain-types';
import { attachContract } from '../../../utils/attach';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type DelegateManagerDelegateDeployedArgs = {
  manager: string;
  account: string;
};

export const delegateManagerDelegateDeployed = async (
  args: DelegateManagerDelegateDeployedArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Check delegate manager delegate deployed',
    env,
    mode: 'read',
    transaction: async () => {
      const delegateManager = await attachContract<IDelegateManager>({
        contractName: 'IDelegateManager',
        contractAddress: args.manager,
        env,
      });
      const isDeployed = await delegateManager.isDelegateDeployed(args.account);
      return { result: isDeployed };
    },
  });
};
