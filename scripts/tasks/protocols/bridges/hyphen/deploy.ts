import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../../../utils/deploy';
import { beginTask } from '../../../../utils/format';
import { operation } from '../../../../utils/operation';

type ProtocolBridgeHyphenDeployArgs = {
  hyphen: string;
  withdrawWhitelist: string;
  dry: boolean;
  nonce?: string;
};

export const protocolBridgeHyphenDeploy = async (
  args: ProtocolBridgeHyphenDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy Hyphen bridge protocol',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'HyphenProtocol',
        constructorParams: [
          {
            hyphen: args.hyphen,
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
