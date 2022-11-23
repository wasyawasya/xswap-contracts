import { TypedDataField } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { _TypedDataEncoder } from 'ethers/lib/utils';
import { SwapStepStruct, SwapStruct } from '../../typechain-types/core/swap/ISwapper';
import { createSignatureDomain } from './domain';

const SWAP_TYPES: Record<string, TypedDataField[]> = {
  TokenCheck: [
    { name: 'token', type: 'address' },
    { name: 'minAmount', type: 'uint256' },
    { name: 'maxAmount', type: 'uint256' },
  ],
  TokenUse: [
    { name: 'protocol', type: 'address' },
    { name: 'chain', type: 'uint256' },
    { name: 'account', type: 'address' },
    { name: 'inIndices', type: 'uint256[]' },
    { name: 'outs', type: 'TokenCheck[]' },
    { name: 'args', type: 'bytes' },
  ],
  SwapStep: [
    { name: 'chain', type: 'uint256' },
    { name: 'swapper', type: 'address' },
    { name: 'account', type: 'address' },
    { name: 'useDelegate', type: 'bool' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'ins', type: 'TokenCheck[]' },
    { name: 'outs', type: 'TokenCheck[]' },
    { name: 'uses', type: 'TokenUse[]' },
  ],
  Swap: [
    { name: 'steps', type: 'SwapStep[]' },
  ],
};

export const createSwapSignature = async (
  xSwapContract: string,
  swap: SwapStruct,
  signer: SignerWithAddress,
  chainId?: number,
): Promise<string> => {
  const domain = createSignatureDomain(xSwapContract, 'xSwap', chainId);
  const signature = await signer._signTypedData(domain, SWAP_TYPES, swap);
  return signature;
}

export const hashSwapStep = (swap: SwapStepStruct): string => {
  const swapHash = _TypedDataEncoder.hashStruct('SwapStep', SWAP_TYPES, swap);
  return swapHash;
}
