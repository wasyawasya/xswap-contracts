import { BigNumber } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IERC20 } from '../../../typechain-types';
import { attachContract } from '../../utils/attach';
import { beginTask } from '../../utils/format';
import { operation } from '../../utils/operation';

type WithdrawJsonArgs = {
  withdrawable: string;
  tokens: string;
  to: string;
};

export const withdrawJson = async (
  args: WithdrawJsonArgs,
  env: HardhatRuntimeEnvironment,
): Promise<void> => {
  beginTask();

  await operation({
    title: 'Generates withdraw operation JSON for sending tokens to one address',
    env,
    mode: 'read',
    transaction: async () => {
      const tokenAddresses = args.tokens.split(',').map((t) => t.trim());
      const tokenBalances = await Promise.all(tokenAddresses.map((token) => getBalance(env, token, args.withdrawable)));
      const withdrawJson = tokenAddresses.map((token, i) => ({ token, amount: tokenBalances[i].toString(), to: args.to }));
      return { result: withdrawJson };
    },
  });
};

const getBalance = async (env: HardhatRuntimeEnvironment, token: string, account: string): Promise<BigNumber> => {
  if (isNativeToken(token)) {
    return await getBalanceOfNative(env, account);
  } else {
    return await getBalanceOfToken(env, token, account);
  }
};

const isNativeToken = (token: string): boolean => {
  const isNative = token.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  return isNative;
}

const getBalanceOfToken = async (env: HardhatRuntimeEnvironment, token: string, account: string): Promise<BigNumber> => {
  const tokenContract = await attachContract<IERC20>({
    contractName: 'IERC20',
    contractAddress: token,
    env,
  });
  const balance = await tokenContract.balanceOf(account);
  return balance;
};

const getBalanceOfNative = async (env: HardhatRuntimeEnvironment, account: string): Promise<BigNumber> => {
  const balance = await env.ethers.provider.getBalance(account);
  return balance;
};
