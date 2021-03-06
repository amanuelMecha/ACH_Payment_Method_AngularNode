import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { TestserviceService } from '../testservice.service';
// // import { MatCheckboxModule } from '@angular/material/checkbox';
// import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
})
export class WelcomeComponent implements OnInit {
  myform: FormGroup;
  value: any;
  accountT = ['saving'];
  bankDetails: any;
  enterTwoNumber: any;
  authorizedFromService: any;
  auth2: any;
  onOff: any = false;
  constructor(
    private formbuild: FormBuilder,
    private service: TestserviceService
  ) {
    this.myform = this.formbuild.group({
      firstName: [''],
      lastName: [''],
      accountNumber: [''],
      routingNumber: [''],
      accountType: [''],
      amountindollar: [''],
      ownershipType: [''],
      favorite: [''],
      concent: false,
      billingAddress: this.formbuild.group({
        streetAddress: [''],
        extendedAddress: [''],
        locality: [''],
        region: [''],
        postalCode: [''],
      }),
    });
    this.myform.valueChanges.subscribe((data) => {
      this.bankDetails = data;
      this.auth2 = data.concent;
      console.log('myform', this.auth2);
    });
    this.generateToken();
  }

  ngOnInit(): void {
    // this.enterTwoNumber = this.service.enterTwoNumber;
    // console.log('entervalue oninit', this.enterTwoNumber);
  }

  generateToken() {
    this.service.getToken();
  }

  createBraintreeFunction() {
    this.authorizedFromService = !this.auth2;
    console.log('authconrr', this.authorizedFromService);
    if (!this.authorizedFromService) {
      this.service.createBraintree(this.bankDetails);
    }
  }
}
