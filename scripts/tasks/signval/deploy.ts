import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployContractData } from '../../utils/deploy';
import { beginTask } from '../../utils/format';
import { operation } from '../../utils/operation';

type SignatureValidatorDeployArgs = {
  dry: boolean;
  nonce?: string;
};

export const signatureValidatorDeploy = async (
  args: SignatureValidatorDeployArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Deploy swap signature validator',
    env,
    mode: args.dry ? 'dry-run' : 'run',
    transaction: async () => {
      const data = await getDeployContractData({
        contractName: 'SwapSignatureValidator',
        constructorParams: [],
        env,
      });
      return { data };
    },
    nonce: args.nonce,
  });
};
