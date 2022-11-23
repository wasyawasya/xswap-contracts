import { TypedDataField } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createSignatureDomain } from './domain';

export interface DaiTokenPermit {
  holder: string;
  spender: string;
  nonce: string | number;
  expiry: string | number;
  allowed: boolean;
}

export const createDaiPermitSignature = async (
  tokenContract: string,
  tokenName: string,
  tokenPermit: DaiTokenPermit,
  signer: SignerWithAddress,
): Promise<string> => {
  const chainId = 1; // Dai mock contract creation code is copied from Ethereum Mainnet
  const domain = createSignatureDomain(tokenContract, tokenName, chainId);

  const types: Record<string, TypedDataField[]> = {
    Permit: [
      { name: 'holder', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'allowed', type: 'bool' },
    ],
  };

  const signature = await signer._signTypedData(domain, types, tokenPermit);
  return signature;
};
