import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../utils/deploy';
import { beginTask } from '../../utils/format';
import { operation } from '../../utils/operation';

type LifeControlDeployArgs = {
  dry: boolean;
  nonce?: string;
};

export const lifeControlDeploy = async (
  args: LifeControlDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy life control',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'LifeControl',
        constructorParams: [],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
