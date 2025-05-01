import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BarComponent } from './bar/bar/bar.component';
import { OwnerComponent } from './roles/owner/owner.component';
import { PeopleComponent } from './bar/people/people.component';
import { PersonComponent } from './bar/person/person.component';
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import { DealerComponent } from './roles/dealer/dealer.component';
import { CustomerComponent } from './roles/customer/customer.component';

import { CardModule } from 'primeng/card';
import {ButtonModule} from "primeng/button";
import {InputTextModule} from "primeng/inputtext";
import {DialogModule} from "primeng/dialog";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {DropdownModule} from "primeng/dropdown";
import {InputNumberModule} from "primeng/inputnumber";
import {FormsModule} from "@angular/forms";
import {ToastModule} from "primeng/toast";
import {ConfirmationService, MessageService} from "primeng/api";
import {DialogService} from "primeng/dynamicdialog";
import {ConfirmDialogModule} from "primeng/confirmdialog";



@NgModule({
  declarations: [
    AppComponent,
    BarComponent,
    OwnerComponent,
    PeopleComponent,
    PersonComponent,
    DealerComponent,
    CustomerComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    RouterModule.forRoot([
      {path: '', component: AppComponent}
    ]),
    BrowserAnimationsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, DialogService, ConfirmationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
