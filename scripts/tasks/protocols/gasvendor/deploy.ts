import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../../utils/deploy';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';
import { OptionSelector } from '../../../utils/selector';

type ProtocolGasVendorDeployArgs = {
  vendor: string;
  variant?: string;
  dry: boolean;
  nonce?: string;
};

const CONTRACT_NAME_BY_VERSION = new OptionSelector(
  'gas vendor variant',
  {
    'v1': 'GasVendorProtocol',
    'v2': 'GasVendorProtocolV2',
  },
  {
    ignoreCaseKey: true,
  },
);

export const protocolGasVendorDeploy = async (
  args: ProtocolGasVendorDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  const contractName = CONTRACT_NAME_BY_VERSION.select(args.variant ?? 'v1');

  await operation({
    title: 'Deploy gas vendor protocol',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName,
        constructorParams: [args.vendor],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
