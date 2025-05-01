import {Component, Input, OnInit} from '@angular/core';
import {ContractService} from "../../shared/contract.service";
import {PersonState} from "../../models";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {compareAddresses} from "../../shared/util/utils";

@Component({
    selector: 'app-barkeeper',
    templateUrl: './dealer.component.html',
})
export class DealerComponent implements OnInit {
    role: string = "owner";
    @Input()
    person!: PersonState;
    lastCoinFlip: string = "No coin flipped yet";

    availablePersons: string[] = [];

    constructor(private contractService: ContractService,
                private ref: DynamicDialogRef,
                private config: DynamicDialogConfig
    ) {
        this.person = config.data.person;
    }

    ngOnInit() {
        this.contractService.invitedAddresses$.subscribe(addressList => this.availablePersons = addressList);
        this.contractService.staffState$.subscribe(staffState => {
            this.person = staffState.customers.find(c => compareAddresses(c.address, this.person.address))!;
        });
    }

    openCasino() {
        this.contractService.callContractMethod({
            from: this.person.address,
            method: this.contractService.casinoContractInstance.methods.openCasino()
        })
    }

    closeCasino() {
        this.contractService.callContractMethod({
            from: this.person.address,
            method: this.contractService.casinoContractInstance.methods.closeCasino()
        })
    }

    renounceDealer() {
        this.contractService.callContractMethod({
            from: this.person.address,
            method: this.contractService.casinoContractInstance.methods.renounceDealer()
        })
        this.ref.close();
    }

    stopBetting() {
        this.contractService.callContractMethod({
            from: this.person.address,
            method: this.contractService.casinoContractInstance.methods.stopCommitPhase()
        });
    }

    startBetting() {
        this.contractService.callContractMethod({
            from: this.person.address,
            method: this.contractService.casinoContractInstance.methods.forceStartCommitPhase()
        });
    }

    flipCoin() {
        let isHeads = Math.random() < 0.5;
        this.lastCoinFlip = isHeads ? "Heads" : "Tails";
        this.contractService.casinoState$.value.lastCoinFlip = this.lastCoinFlip;

        this.contractService.callContractMethod({
            from: this.person.address,
            method: this.contractService.casinoContractInstance.methods.setCoinFlipValue(isHeads)
        });
    }


}
