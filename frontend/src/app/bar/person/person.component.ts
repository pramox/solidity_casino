import {Component, Input} from '@angular/core';
import {PersonState} from "../../models";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {OwnerComponent} from "../../roles/owner/owner.component";
import {CustomerComponent} from "../../roles/customer/customer.component";
import {DealerComponent} from "../../roles/dealer/dealer.component";

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
})
export class PersonComponent {
  @Input()
  role!: string;
  @Input()
  person!: PersonState;

  ref: DynamicDialogRef | null = null;

  constructor(private dialogService: DialogService) {}


  openDialog() {
    let config = {
      header: '',
      modal: true,
      resizable: true,
      closeOnEscape: true,
      dismissableMask: true,
      data: {person: this.person}
    }
    switch (this.role) {
      case 'owner':
        config.header = 'Bar Owner';
        this.ref = this.dialogService.open(OwnerComponent, config);
        break;
      case 'dealer':
        config.header = 'Dealer';
        this.ref = this.dialogService.open(DealerComponent, config);
        break;
      case 'customer':
        config.header = 'Customer';
        this.ref = this.dialogService.open(CustomerComponent, config);
        break;
      default:
        return;
    }
  }
}
