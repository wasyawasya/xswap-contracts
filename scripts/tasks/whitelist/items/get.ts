import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IAccountWhitelist } from '../../../../typechain-types';
import { attachContract } from '../../../utils/attach';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type WhitelistGetArgs = {
  whitelist: string;
};

export const whitelistGet = async (
  args: WhitelistGetArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Get whitelist accounts',
    env,
    mode: 'read',
    transaction: async () => {
      const accountWhitelist = await attachContract<IAccountWhitelist>({
        contractName: 'IAccountWhitelist',
        contractAddress: args.whitelist,
        env,
      });
      const accounts = await accountWhitelist.getWhitelistedAccounts();
      return { result: accounts };
    },
  });
};
