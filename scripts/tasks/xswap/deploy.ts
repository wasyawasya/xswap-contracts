import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../utils/deploy';
import { beginTask } from '../../utils/format';
import { operation } from '../../utils/operation';

type XSwapDeployArgs = {
  swapSignatureValidator: string;
  permitResolverWhitelist: string;
  useProtocolWhitelist: string;
  delegateManager: string;
  withdrawWhitelist: string;
  lifeControl: string;
  dry: boolean;
  nonce?: string;
};

export const xSwapDeploy = async (
  args: XSwapDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy xSwap',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'XSwap',
        constructorParams: [
          {
            swapSignatureValidator: args.swapSignatureValidator,
            permitResolverWhitelist: args.permitResolverWhitelist,
            useProtocolWhitelist: args.useProtocolWhitelist,
            delegateManager: args.delegateManager,
            withdrawWhitelist: args.withdrawWhitelist,
            lifeControl: args.lifeControl,
          },
        ],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
