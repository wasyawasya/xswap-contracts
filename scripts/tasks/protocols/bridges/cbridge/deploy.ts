import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../../../utils/deploy';
import { beginTask } from '../../../../utils/format';
import { operation } from '../../../../utils/operation';

type ProtocolBridgeCBridgeDeployArgs = {
  cBridge: string;
  withdrawWhitelist: string;
  dry: boolean;
  nonce?: string;
};

export const protocolBridgeCBridgeDeploy = async (
  args: ProtocolBridgeCBridgeDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy cBridge bridge protocol',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'CBridgeProtocol',
        constructorParams: [
          {
            cBridge: args.cBridge,
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
