import {Component, OnInit} from '@angular/core';
import {ContractService} from "./shared/contract.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  barAddress: string = "";
  barInitialized: boolean = false;
  blockNumber: number = 0;

  constructor(private contractService: ContractService,
              private router: Router,
              private activatedRoute: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {
    this.connectToClient();
  }

  private async connectToClient() {
    const isConnected = await this.contractService.connectToClient("ws://localhost:9545") // TODO [providerPort] Edit for desired network
    if (isConnected) {
      console.info("Connected!");
      this.subscribeToBarAddress();
      this.subscribeToBlockNumber();
    } else {
        window.alert("Failed to connect! Check your port!")
    }
  }

  private async subscribeToBlockNumber() {
    this.contractService.blockNumber$.subscribe(blockNumber => this.blockNumber = blockNumber);
    this.blockNumber = await window.web3.eth.getBlockNumber();
  }

  private subscribeToBarAddress() {
    this.activatedRoute.queryParams.subscribe(
        async params => {
          const address = params['contract']
          if (address === undefined || address == '') return;
          this.barInitialized = await this.contractService.loadCasino(address);
        }
    )
  }

  async submitBarAddress(address: string) {
    if (this.barAddress === address || address === '') return;
    this.barAddress = address;
    this.barInitialized = await this.contractService.loadCasino(address);
  }

}
