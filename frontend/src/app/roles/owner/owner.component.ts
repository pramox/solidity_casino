import {Component, Input, OnInit} from '@angular/core';
import {ContractService} from "../../shared/contract.service";
import {PersonState} from "../../models";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {ConfirmationService} from "primeng/api";
import {compareAddresses} from "../../shared/util/utils";

@Component({
  selector: 'app-owner',
  templateUrl: './owner.component.html',
})
export class OwnerComponent implements OnInit {
  role: string = "owner";
  @Input()
  person!: PersonState;

  currentTokenPrice: string | null = null;
  availablePersons: string[] = [];
  availableRolesPromote: string[] = ["dealer", "owner"];
  availableRolesRevoke: string[] = ["dealer"];
  casinoTokenAddress: string | null | undefined;

  tokenAmount: number = 0;

  constructor(private contractService: ContractService,
              private ref: DynamicDialogRef,
              private config: DynamicDialogConfig,
              private confirmationService: ConfirmationService
  ) {
    this.person = config.data.person;
  }

  ngOnInit() {
    this.contractService.invitedAddresses$.subscribe(addressList => this.availablePersons = addressList);
    this.contractService.casinoState$.subscribe(casinoState => {
      this.currentTokenPrice = window.web3.utils.fromWei(casinoState.tokenPrice, 'ether');
      this.casinoTokenAddress = casinoState.casinoTokenContractAddress;
    });
    this.contractService.staffState$.subscribe(staffState => {
      this.person = staffState.customers.find(c => compareAddresses(c.address, this.person.address))!;
    });
  }

  supplyToken(amount: string) {
    const casinoAddress = this.contractService.casinoContractInstance._address;
    this.confirmationService.confirm({
      message: `Send ${amount} Beertokens from ${this.person.address} to ${casinoAddress}?`,
      accept: () =>
          this.contractService.callContractMethod({
            from: this.person.address,
            method: this.contractService.casinoTokenContractInstance.methods.transfer(casinoAddress, parseInt(amount), window.web3.utils.toHex('supply'))
          })
    })
  }

  setCasinoTokenPrice(amount: string) {
    const price = window.web3.utils.toWei(amount, 'ether');
    this.contractService.callContractMethod({
      from: this.person.address,
      method: this.contractService.casinoContractInstance.methods.setTokenPrice(price)
    })
  }

  promoteRole(role: string, address: string) {
    let method;
    switch (role) {
      case 'owner':
        method = this.contractService.casinoContractInstance.methods.addOwner(address);
        break;
      case 'dealer':
        method = this.contractService.casinoContractInstance.methods.addDealer(address)
        break;
      default:
        return;
    }
    this.contractService.callContractMethod({
      from: this.person.address,
      method: method
    })
  }

  revokeRole(role: string, address: string) {
    let method;
    switch (role) {
      case 'dealer':
        method = this.contractService.casinoContractInstance.methods.revokeDealer(address)
        break;
      default:
        return;
    }
    this.contractService.callContractMethod({
      from: this.person.address,
      method: method
    })
  }

  //TODO
  /*
  payout(recipient: string, amount: string) {
    const amountInWei = window.web3.utils.toWei(amount, 'ether');
    this.contractService.callContractMethod({
      from: this.person.address,
      method: this.contractService.casinoContractInstance.methods.payout(recipient, amountInWei)
    })
  }
   */

  mintTokens(amount: string) {
    this.confirmationService.confirm({
      message: `Mint ${amount} CasinoTokens?`,
      accept: () => this.contractService.callContractMethod({
        from: this.person.address,
        method: this.contractService.casinoTokenContractInstance.methods.mint(this.person.address, parseInt(amount))
      })
    });
  }

  setCasinoTokenAddress(token: string) {
    this.contractService.callContractMethod({
      from: this.person.address,
      method: this.contractService.casinoContractInstance.methods.setTokenAddress(token)
    });
  }

  renounceOwner() {
    this.contractService.callContractMethod({
      from: this.person.address,
      method: this.contractService.casinoContractInstance.methods.renounceOwner()
    })
    this.ref.close();
  }

}
