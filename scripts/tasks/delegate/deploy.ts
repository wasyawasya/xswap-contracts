import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../utils/deploy';
import { beginTask } from '../../utils/format';
import { operation } from '../../utils/operation';

type DelegateDeployArgs = {
  dry: boolean;
  nonce?: string;
};

export const delegateDeploy = async (
  args: DelegateDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy delegate',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'Delegate',
        constructorParams: [],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
