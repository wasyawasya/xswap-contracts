import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IAccountWhitelist } from '../../../../typechain-types';
import { attachContract } from '../../../utils/attach';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type WhitelistRemoveArgs = {
  whitelist: string;
  account: string;
  dry: boolean;
  nonce?: string;
};

export const whitelistRemove = async (
  args: WhitelistRemoveArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Remove account from whitelist',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const accountWhitelist = await attachContract<IAccountWhitelist>({
        contractName: 'IAccountWhitelist',
        contractAddress: args.whitelist,
        env,
      });
      const data = accountWhitelist.interface.encodeFunctionData(
        'removeAccountFromWhitelist',
        [args.account],
      );
      return { data, to: accountWhitelist.address };
    },
    nonce: args.nonce,
  });
};
