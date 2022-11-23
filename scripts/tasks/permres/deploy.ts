import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../utils/deploy';
import { beginTask } from '../../utils/format';
import { operation } from '../../utils/operation';
import { OptionSelector } from '../../utils/selector';

type PermitResolverDeployArgs = {
  dry: boolean;
  type: string;
  nonce?: string;
};

const CONTRACT_NAME_BY_TYPE = new OptionSelector(
  'protocol',
  {
    'default': 'PermitResolver',
    'dai': 'DaiPermitResolver',
  },
  {
    ignoreCaseKey: true,
  },
);

export const permitResolverDeploy = async (
  args: PermitResolverDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  const contractName = CONTRACT_NAME_BY_TYPE.select(args.type);

  await operation({
    title: 'Deploy permit resolver',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName,
        constructorParams: [],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
