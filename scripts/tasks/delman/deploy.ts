import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../utils/deploy';
import { beginTask } from '../../utils/format';
import { operation } from '../../utils/operation';

type DelegateManagerDeployArgs = {
  delegatePrototype: string;
  withdrawWhitelist: string;
  dry: boolean;
  nonce?: string;
};

export const delegateManagerDeploy = async (
  args: DelegateManagerDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy delegate manager',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'DelegateManager',
        constructorParams: [
          {
            delegatePrototype: args.delegatePrototype,
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
