import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IDelegateManager } from '../../../../typechain-types';
import { attachContract } from '../../../utils/attach';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type DelegateManagerDelegatePredictArgs = {
  manager: string;
  account: string;
};

export const delegateManagerDelegatePredict = async (
  args: DelegateManagerDelegatePredictArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Predict delegate manager delegate deploy address',
    env,
    mode: 'read',
    transaction: async () => {
      const delegateManager = await attachContract<IDelegateManager>({
        contractName: 'IDelegateManager',
        contractAddress: args.manager,
        env,
      });
      const delegateAddress = await delegateManager.predictDelegateDeploy(args.account);
      return { result: delegateAddress };
    },
  });
};
