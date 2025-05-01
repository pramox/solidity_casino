import {Component, OnInit} from '@angular/core';
import {ContractService} from "../../shared/contract.service";
import {CasinoState} from "../../models";
import {ActivatedRoute, Router} from "@angular/router";


@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.css']
})
export class BarComponent implements OnInit {
  casinoState: CasinoState | null = null;

  constructor(private contractService: ContractService,
              private router: Router,
              private activatedRoute: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.contractService.casinoState$.subscribe(casinoState => this.casinoState = casinoState);
    this.subscribeToAddresses();
  }

  /**
   * Extracts invited addresses from the URl and invites them.
   */
  private async subscribeToAddresses() {
    this.activatedRoute.queryParams.subscribe(
        params => {
          const addressParams = params['invite']
          if (!addressParams) return;
          const addresses: string[] = addressParams.split(',');
          addresses.forEach(a => this.invite(a));
        }
    )
  }

  invite(address: string) {
    this.contractService.inviteAddress(address);
  }

  getTokenPrice(): string {
    if (this.casinoState == null) return "";
    return window.web3.utils.fromWei(this.casinoState.tokenPrice.toString(), 'ether');
  }
}
