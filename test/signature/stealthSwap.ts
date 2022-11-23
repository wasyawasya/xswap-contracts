import { TypedDataField } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { StealthSwapStruct } from '../../typechain-types/core/swap/ISwapper';
import { createSignatureDomain } from './domain';

const STEALTH_SWAP_TYPES: Record<string, TypedDataField[]> = {
  StealthSwap: [
    { name: 'chain', type: 'uint256' },
    { name: 'swapper', type: 'address' },
    { name: 'account', type: 'address' },
    { name: 'stepHashes', type: 'bytes32[]' },
  ],
};

export const createStealthSwapSignature = async (
  xSwapContract: string,
  stealthSwap: StealthSwapStruct,
  signer: SignerWithAddress,
  chainId?: number,
): Promise<string> => {
  const domain = createSignatureDomain(xSwapContract, 'xSwap', chainId);
  const signature = await signer._signTypedData(domain, STEALTH_SWAP_TYPES, stealthSwap);
  return signature;
}
