import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TestserviceService } from '../testservice.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit {
  myform: FormGroup;
  fNumber: any;
  sNumber: any;
  amountInput: any;
  constructor(
    private service: TestserviceService,
    private formbuild: FormBuilder
  ) {
    this.myform = formbuild.group({
      firstNumber: ['17'],
      secondNumber: ['29'],
    });
    this.myform.valueChanges.subscribe((data) => {
      this.fNumber = +data.firstNumber;
      this.sNumber = +data.secondNumber;

      console.log('pay', data);
    });
  }

  ngOnInit(): void {}
  sendFinalPayment() {
    console.log('final paymensend', this.fNumber, this.sNumber);
    //17,29
    this.service.finalPay(this.fNumber, this.sNumber);
  }
}
