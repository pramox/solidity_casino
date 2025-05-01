import {Injectable} from '@angular/core';
import Web3 from 'web3';

import CasinoAbi from '../../abi/Casino.json';
import CasinoTokenAbi from '../../abi/CasinoToken.json';
import {CasinoState, initialCasinoState, initialStaffState, PersonState, StaffState} from "../models";
import {BehaviorSubject} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {MessageService} from "primeng/api";
import {callContractMethodWithMessage, CallOptions, errorMessage} from "./util/utils";


@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private web3: any;

  /**
   * Global contract instances
   */
  casinoContractInstance: any | null = null;
  casinoTokenContractInstance: any | null = null;

  /**
   * Observables as global state where components can subscribe to and receive updates automatically.
   */
  blockNumber$ = new BehaviorSubject<number>(0);
  invitedAddresses$ = new BehaviorSubject<string[]>([]);
  casinoState$ = new BehaviorSubject<CasinoState>(initialCasinoState);
  staffState$ = new BehaviorSubject<StaffState>(initialStaffState);

  constructor(private router: Router,
              private activatedRoute: ActivatedRoute,
              private messageService: MessageService,
  ) {}

  callContractMethod(options: CallOptions) {
    callContractMethodWithMessage(options, this.messageService)
  }

  async connectToClient(host: string): Promise<boolean> {
    try {
      const provider = new Web3.providers.WebsocketProvider(host);
      window.web3 = this.web3 = new Web3(provider);
      return await this.web3.eth.net.isListening();
    } catch (e) {
      console.error("Connection failed with error: ", e)
      return false;
    }
  }

  async loadCasino(address: string): Promise<boolean> {
    const isValid = await this.checkCasinoContract(address);
    if (isValid) {
      await this.updateUrl({contract: address});
      await this.initCasinoContract(address);
      await this.initTokenContract();
      await this.loadCasinoContract();
      this.listenToContractEvents();
      this.listenToBlockUpdates();
    }
    return isValid;
  }

  // Update url to be able to restore state easily on reload
  private async updateUrl(queryParams: any) {
    await this.router.navigate(
        [],
        {
          relativeTo: this.activatedRoute,
          queryParams: queryParams,
          queryParamsHandling: 'merge'
        });
  }

  private async checkCasinoContract(address: string): Promise<boolean> {
    // Check whether casino contract is deployed by checking whether there is code deployed on that address
    const data = await this.web3.eth.getCode(address);
    if (data === "0x") {
      window.alert("No contract deployed on that address!");
      return false;
    }
    return true;
  }

  private async initCasinoContract(address: string) {
    this.casinoContractInstance = new this.web3.eth.Contract(CasinoAbi.abi, address);
  }

  private async initTokenContract() {
    const tokenAddress = await this.casinoContractInstance.methods.getTokenAddress().call();
    if (tokenAddress === '0x0000000000000000000000000000000000000000') return;
    const isValid = await this.isTokenAddressValid(tokenAddress);
    if (isValid) {
      this.casinoTokenContractInstance = new this.web3.eth.Contract(CasinoTokenAbi.abi, tokenAddress);
    } else {
      this.messageService.add(errorMessage('Invalid address for Casino Token: ' + tokenAddress));
    }
  }

  private async isTokenAddressValid(address: string) {
    const casinoToken = new this.web3.eth.Contract(CasinoTokenAbi.abi, address);
    // Check whether the casinoToken address actually points to a corresponding token contract by calling a method.
    return casinoToken.methods.balanceOf('0x0000000000000000000000000000000000000000').call()
        .then(() => {
          return true;
        }).catch(() => {
          console.log("Invalid token contract address!");
          return false;
        });
  }

  async loadCasinoContract() {
    const address = this.casinoContractInstance.options.address;
    const ether = this.web3.utils.fromWei(await this.web3.eth.getBalance(address), "ether");
    const isOpen = await this.casinoContractInstance.methods.casinoIsOpen().call();
    const tokenPrice = await this.casinoContractInstance.methods.getTokenPrice().call();
    let lastCoinFlip = await this.casinoContractInstance.methods.getLastCoinFlip().call();

    console.log("AAAAAAAAAAAA" + lastCoinFlip);
    let casinoTokenContractAddress
    let tokenAmount;
    let tokenTotalSupply;
    let tokenName;
    let tokenSymbol;

    if (this.casinoTokenContractInstance !== null) {
      casinoTokenContractAddress = this.casinoTokenContractInstance.options.address;
      tokenName = await this.casinoTokenContractInstance.methods.name().call();
      tokenSymbol = await this.casinoTokenContractInstance.methods.symbol().call();
      tokenAmount = await this.casinoTokenContractInstance.methods.balanceOf(address).call();
      tokenTotalSupply = await this.casinoTokenContractInstance.methods.totalSupply().call();
    }
    const newState = {
      address,
      ether,
      isOpen,
      tokenPrice: tokenPrice,
      casinoTokenContractAddress: casinoTokenContractAddress,
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      tokenAmount: tokenAmount,
      tokenTotalSupply: tokenTotalSupply,
      lastCoinFlip: lastCoinFlip,
    };
    this.casinoState$.next(newState);
  }

  async inviteAddress(address: string) {
    const invitedAddresses = this.invitedAddresses$.value;
    if (invitedAddresses.includes(address)) {
      console.warn("Address already invited.")
      return;
    }
    invitedAddresses.push(address);
    this.invitedAddresses$.next(invitedAddresses)
    await this.updateUrl({invite: invitedAddresses.join(',')});
    await this.addPerson(address);
  }

  async addPerson(address: string) {
    let casinoContract = this.casinoContractInstance;
    const newState = this.staffState$.value;

    newState.customers.push(await this.getPersonData(address));

    if (await casinoContract.methods.isDealer(address).call()) {
      newState.dealers.push(address.toUpperCase());
    }
    if (await casinoContract.methods.isOwner(address).call()) {
      newState.owners.push(address.toUpperCase());
    }

    this.staffState$.next(newState);
  }

  private async getPersonData(address: string): Promise<PersonState> {
    const web3 = window.web3;
    const ether = web3.utils.fromWei(await web3.eth.getBalance(address), "ether");

    let casinoTokens;
    if (this.casinoTokenContractInstance != null) {
      casinoTokens = await this.casinoTokenContractInstance.methods.balanceOf(address).call();
    }
    return {address, ether, casinoTokens: casinoTokens};
  }

  listenToContractEvents() {
    console.info("Listening for contract events...");
    /*

    this.casinoContractInstance.events.BarOpened((error: any, result: any) => {
      console.info('got Event: BarOpened', result);
      if (!error) {
        this.casinoState$.next({...this.casinoState$.value, isOpen: true});
      } else {
        this.messageService.add(errorMessage(error));
      }
    });

    this.casinoContractInstance.events.BarClosed((error: any, result: any) => {
      console.info('got Event: BarClosed', result);
      if (!error) {
        this.casinoState$.next({...this.casinoState$.value, isOpen: false});
      } else {
        this.messageService.add(errorMessage(error));
      }
    });

    this.casinoContractInstance.events.OwnerAdded((error: any, result: any) => {
      console.info('got Event: OwnerAdded', result);
      if (!error) {
        const newState = this.staffState$.value;
        newState.owners.push(result.returnValues[0].toUpperCase());
        this.staffState$.next(newState);
      } else {
        this.messageService.add(errorMessage(error));
      }
    });

    this.casinoContractInstance.events.OwnerRemoved((error: any, result: any) => {
      console.info('got Event: OwnerRemoved', result);
      if (!error) {
        const newState = this.staffState$.value;
        _.remove(newState.owners, address => compareAddresses(address, result.returnValues[0]));
        this.staffState$.next(newState);
      } else {
        this.messageService.add(errorMessage(error));
      }
    })

    this.casinoContractInstance.events.BarkeeperAdded((error: any, result: any) => {
      console.info('got Event: BarkeeperAdded', result);
      if (!error) {
        const newState = this.staffState$.value;
        newState.dealers.push(result.returnValues[0].toUpperCase());
        this.staffState$.next(newState);
      } else {
        this.messageService.add(errorMessage(error));
      }
    });

    this.casinoContractInstance.events.BarkeeperRemoved((error: any, result: any) => {
      console.info('got Event: BarkeeperRemoved', result);
      if (!error) {
        const newState = this.staffState$.value;
        _.remove(newState.dealers, address => compareAddresses(address, result.returnValues[0]));
        this.staffState$.next(newState);
      } else {
        this.messageService.add(errorMessage(error));
      }
    })

     */
  }

  listenToBlockUpdates() {
    this.web3.eth.subscribe('newBlockHeaders', async (error: any, result: any) => {
      console.log("New block mined: ", result);

      if (error) {
        this.messageService.add(errorMessage(error));
        return;
      }

      // Check if casinoToken has changed
      const newAddress = (await this.casinoContractInstance.methods.getTokenAddress().call());
      if (this.casinoTokenContractInstance.options.address !== newAddress) {
        this.casinoTokenContractInstance = new this.web3.eth.Contract(CasinoTokenAbi.abi, newAddress);
        this.casinoState$.next({...this.casinoState$.value, casinoTokenContractAddress: newAddress});
      }

      this.blockNumber$.next(await this.web3.eth.getBlockNumber());

      this.invitedAddresses$.value.forEach(a => this.updatePerson(a));
      await this.updateCasinoState();
    });
  }

  private async updatePerson(address: string) {
    const newPersonState = await this.getPersonData(address);
    const newState = this.staffState$.value;

    const index = newState.customers.findIndex(c => c.address === address);
    newState.customers[index] = newPersonState;

    this.staffState$.next(newState);
  }

  private async updateCasinoState() {
    const web3 = this.web3;
    const casinoAddress = this.casinoContractInstance.options.address;
    const ether = web3.utils.fromWei(await web3.eth.getBalance(casinoAddress), "ether");
    const tokenPrice = await this.casinoContractInstance.methods.getTokenPrice().call();

    let tokenAmount;
    let totalSupply;
    if (this.casinoTokenContractInstance != null) {
      tokenAmount = await this.casinoTokenContractInstance.methods.balanceOf(casinoAddress).call();
      totalSupply = await this.casinoTokenContractInstance.methods.totalSupply().call();
    }

    this.casinoState$.next({...this.casinoState$.value, ether, tokenPrice: tokenPrice, tokenAmount: tokenAmount, tokenTotalSupply: totalSupply});
  }
}

