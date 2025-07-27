import { getAddress } from "thirdweb/utils";

/**
 * Compares two Ethereum addresses for equality.
 * Handles case-insensitive comparison and invalid addresses.
 * 
 * @param address1 - First address to compare
 * @param address2 - Second address to compare
 * @returns true if addresses are equal, false otherwise
 */
export const isAddressEqual = (address1: string, address2: string): boolean => {
  try {
    const normalized1 = getAddress(address1);
    const normalized2 = getAddress(address2);
    return normalized1 === normalized2;
  } catch (error) {
    // If either address is invalid, they're not equal
    return false;
  }
};

/**
 * Checks if an address is valid.
 * 
 * @param address - Address to validate
 * @returns true if address is valid, false otherwise
 */
export const isValidAddress = (address: string): boolean => {
  try {
    getAddress(address);
    return true;
  } catch (error) {
    return false;
  }
}; 