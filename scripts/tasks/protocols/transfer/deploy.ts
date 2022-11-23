import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../../utils/deploy';
import { beginTask } from '../../../utils/format';
import { operation } from '../../../utils/operation';

type ProtocolTransferDeployArgs = {
  dry: boolean;
  nonce?: string;
};

export const protocolTransferDeploy = async (
  args: ProtocolTransferDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy transfer protocol',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'TransferProtocol',
        constructorParams: [],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
