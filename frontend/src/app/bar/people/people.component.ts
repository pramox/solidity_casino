import {Component, OnInit} from '@angular/core';
import {ContractService} from "../../shared/contract.service";
import {PersonState} from "../../models";

@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.css']
})
export class PeopleComponent implements OnInit {
  owners: PersonState[] = [];
  dealers: PersonState[] = [];
  customers: PersonState[] = [];

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.contractService.staffState$.subscribe((staffState) => {
      this.owners = staffState.customers.filter(c => staffState.owners.includes(c.address.toUpperCase()));
      this.dealers = staffState.customers.filter(c => staffState.dealers.includes(c.address.toUpperCase()));
      this.customers = staffState.customers;
    });
  }
}
