import { TypedDataDomain } from '@ethersproject/abstract-signer';
import { TEST_CHAIN_ID } from '../common/chainId';

export const createSignatureDomain = (
  contract: string,
  name: string,
  chainId = TEST_CHAIN_ID,
): TypedDataDomain => {
  const domain: TypedDataDomain = {
    name,
    version: '1',
    chainId,
    verifyingContract: contract,
  };
  return domain;
}
