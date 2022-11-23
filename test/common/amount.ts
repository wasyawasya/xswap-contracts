import { decimalInt } from './decimal';

export const amount = (amount: number | string): string => {
  return decimalInt(amount, 18); // ETH-like
};
