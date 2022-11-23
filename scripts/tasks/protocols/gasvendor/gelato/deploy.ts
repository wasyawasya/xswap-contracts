import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../../../utils/deploy';
import { beginTask } from '../../../../utils/format';
import { operation } from '../../../../utils/operation';

type ProtocolGasVendorGelatoDeployArgs = {
  ops: string;
  relay: string;
  dry: boolean;
  nonce?: string;
};

export const protocolGasVendorGelatoDeploy = async (
  args: ProtocolGasVendorGelatoDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy Gelato gas vendor protocol',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'GelatoGasVendor',
        constructorParams: [
          {
            ops: args.ops,
            relay: args.relay,
          },
        ],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
