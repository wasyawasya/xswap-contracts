import { TypedDataField } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createSignatureDomain } from './domain';

export interface TokenPermit {
  owner: string;
  spender: string;
  value: string | number;
  nonce: string | number;
  deadline: string | number;
}

export const createPermitSignature = async (
  tokenContract: string,
  tokenName: string,
  tokenPermit: TokenPermit,
  signer: SignerWithAddress,
): Promise<string> => {
  const domain = createSignatureDomain(tokenContract, tokenName);

  const types: Record<string, TypedDataField[]> = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const signature = await signer._signTypedData(domain, types, tokenPermit);
  return signature;
};
