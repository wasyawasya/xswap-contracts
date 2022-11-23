import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../../utils/deploy';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type CallGenericDeployArgs = {
  withdrawWhitelist: string;
  dry: boolean;
  nonce?: string;
};

export const callGenericDeploy = async (
  args: CallGenericDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy generic call',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'GenericCall',
        constructorParams: [
          {
            withdrawWhitelist: args.withdrawWhitelist,
          },
        ],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
