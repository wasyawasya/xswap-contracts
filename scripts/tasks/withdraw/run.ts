import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IWithdrawable } from '../../../typechain-types';
import { attachContract } from '../../utils/attach';
import { beginTask } from '../../utils/format';
import { operation } from '../../utils/operation';

type WithdrawRunArgs = {
  withdrawable: string;
  withdrawJson: string; // `[{"token": "0x...", "amount": "123", "to": "0x..."}, ...]`
  dry: boolean;
  nonce?: string;
};

export const withdrawRun = async (
  args: WithdrawRunArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Withdraw assets from a withdrawable',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const accountWhitelist = await attachContract<IWithdrawable>({
        contractName: 'IWithdrawable',
        contractAddress: args.withdrawable,
        env,
      });
      const data = accountWhitelist.interface.encodeFunctionData(
        'withdraw',
        [
          JSON.parse(args.withdrawJson),
        ],
      );
      return { data, to: accountWhitelist.address };
    },
    nonce: args.nonce,
  });
};
