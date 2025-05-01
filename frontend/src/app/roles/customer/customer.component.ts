import {Component, Input, OnInit} from '@angular/core';
import {PersonState} from "../../models";
import {ContractService} from "../../shared/contract.service";
import {DynamicDialogConfig} from "primeng/dynamicdialog";
import {ConfirmationService} from "primeng/api";
import {compareAddresses} from "../../shared/util/utils";
import BN from "bn.js";

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
})
export class CustomerComponent implements OnInit {
  role: string = "customer";
  @Input()
  person!: PersonState;

  coinOptions = ["Heads", "Tails"];

  constructor(private contractService: ContractService,
              private config: DynamicDialogConfig,
              private confirmationService: ConfirmationService
  ) {
    this.person = config.data.person;
  }

  ngOnInit() {
    this.contractService.staffState$.subscribe(staffState => {
      this.person = staffState.customers.find(c => compareAddresses(c.address, this.person.address))!;
    });
  }

  buyCasinoToken(amount: string) {
    const tokenPrice = this.contractService.casinoState$.value.tokenPrice;
    const web3 = window.web3;
    const priceInWei = web3.utils.toBN(tokenPrice).mul(web3.utils.toBN(parseInt(amount)));
    this.confirmationService.confirm({
      message: `Buy ${amount} CasinoTokens for ${web3.utils.fromWei(priceInWei, 'ether')} ETH?`,
      accept: () => this.contractService.callContractMethod({
        from: this.person.address,
        method: this.contractService.casinoContractInstance.methods.buyToken(),
        value: priceInWei
      })
    })
  }

  flipCoin(amountString: string, coinFlip: string) {
    let amount = parseInt(amountString);
    if (!this.person.casinoTokens || amount > this.person.casinoTokens) {
      alert("You don't have enough token");
      return;
    }
    let isHeads = false;
    if (coinFlip === "Heads") {
      isHeads = true;
    } else if (coinFlip !== "Tails") {
      return;
    }
    let buf = new Uint8Array(1);
    crypto.getRandomValues(buf);

    const randomNumber = buf[0];
    this.person.currentSecretNumber = randomNumber;

    const web3 = require('web3');
    let hash = web3.utils.soliditySha3(new BN(randomNumber), isHeads);

   this.contractService.callContractMethod({
      from: this.person.address,
      method: this.contractService.casinoContractInstance.methods.commit(hash, amount)
    });
   alert("Save this random number once betting is over to reveal after: " + randomNumber);
  }

  revealCoinFlip(rand: string, coinFlip: string) {
    let randomNumber = parseInt(rand);
    let isHeads = false;
    if (coinFlip === "Heads") {
      isHeads = true;
    } else if (coinFlip !== "Tails") {
      return;
    }
    this.contractService.callContractMethod({
      from: this.person.address,
      method: this.contractService.casinoContractInstance.methods.reveal(randomNumber, isHeads)
    });
  }

  cashOutToken(amount: string) {
    this.contractService.callContractMethod({
      from: this.person.address,
      method: this.contractService.casinoContractInstance.methods.cashOutTokens(parseInt(amount))
    });
  }
}
