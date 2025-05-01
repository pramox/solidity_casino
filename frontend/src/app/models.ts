export interface CasinoState {
  address: string,
  ether: number;
  isOpen: boolean;
  tokenPrice: string,
  casinoTokenContractAddress?: string | null;
  tokenName?: string;
  tokenSymbol?: string;
  tokenAmount?: number;
  tokenTotalSupply?: number;
  lastCoinFlip?: string;
}

/**
 * Note: all owners and dealers are also customers. Therefore, only save the addresses of them.
 */
export interface StaffState {
  owners: string[], // must be uppercase!
  dealers: string[], // must be uppercase!
  customers: PersonState[],
}

export interface PersonState {
  address: string,
  ether: string,
  casinoTokens?: number,
  currentSecretNumber?: number,
}

export const initialCasinoState: CasinoState = {
  address: "",
  ether: 0,
  isOpen: false,
  tokenPrice: "0",
};

export const initialStaffState: StaffState = {
  owners: [],
  dealers: [],
  customers: []
};
