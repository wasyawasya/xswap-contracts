import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IDelegateManager } from '../../../../typechain-types';
import { attachContract } from '../../../utils/attach';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type DelegateManagerDelegateWithdrawArgs = {
  manager: string;
  account: string;
  withdrawJson: string;
  dry: boolean;
  nonce?: string;
};

export const delegateManagerDelegateWithdraw = async (
  args: DelegateManagerDelegateWithdrawArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Withdraw from delegate manager delegate',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const delegateManager = await attachContract<IDelegateManager>({
        contractName: 'IDelegateManager',
        contractAddress: args.manager,
        env,
      });
      const data = delegateManager.interface.encodeFunctionData(
        'withdraw',
        [
          args.account,
          JSON.parse(args.withdrawJson),
        ],
      );
      return { data, to: delegateManager.address };
    },
    nonce: args.nonce,
  });
};
