import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as braintree from 'braintree-web';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class TestserviceService {
  value: any = '';
  braintree: any;
  token: any;
  nounce: any;
  nonceValue: any = '';
  enterTwoNumber: any;
  amountInput: any;
  countRetry: number = 0;
  validAccount: any;

  url = 'http://localhost:3030/';
  constructor(private http: HttpClient, private route: Router) {}
  //step 1 and 2 requests a client token from your server and server send token

  getToken() {
    return this.http
      .get(`${this.url}initializeBraintree`)
      .subscribe((data: any) => {
        this.token = data.data;
        // console.log('dataa', data.data);
      });
  }

  // step 3 and step 4  to get payment method nonce from braintree and
  //  send payment method nonce to the server
  //The customer submits payment information, the client SDK
  //communicates that information to Braintree and returns a payment method nonce.
  createBraintree = (inputs: any) => {
    console.log('inputs', inputs);
    this.amountInput = inputs.amountindollar;

    braintree.client.create(
      {
        authorization: this.token,
      },
      (clientErr: any, clientInstance: any) => {
        if (clientErr) {
          console.error('There was an error creating the Client.');
          throw clientErr;
        }

        // console.log(clientInstance);
        braintree.usBankAccount.create(
          {
            client: clientInstance,
          },
          (usBankAccountErr: any, usBankAccountInstance: any) => {
            if (usBankAccountErr) {
              console.error(
                'There was an error creating the USBankAccount instance.'
              );
              throw usBankAccountErr;
            }

            var bankDetails = inputs;

            if (bankDetails.ownershipType === 'personal') {
              bankDetails.firstName = inputs.firstName;
              bankDetails.lastName = inputs.lastName;
            } else {
              bankDetails.businessName = '';
            }

            //console.log('before tokenize', bankDetails);
            usBankAccountInstance.tokenize(
              {
                bankDetails: bankDetails, // or bankLogin: bankLogin
                mandateText: inputs.concent,
              },
              (tokenizeErr: any, tokenizedPayload: any) => {
                if (tokenizeErr) {
                  alert('Invalid inputs please check it again');
                  // this.validAccount = true;
                  console.log(
                    'There was an error tokenizing the bank details. chombe'
                  );
                  throw tokenizeErr;
                }
                //Your front-end sends the payment method nonce to your server.
                // Submit tokenizedPayload.nonce to your server as you would
                // other payment method nonces. call 3030/confirmBraintree from backend
                let data = {
                  nonce: tokenizedPayload.nonce,
                  fname: inputs.firstName,
                  lname: inputs.lastName,
                };
                this.http
                  .post(`http://localhost:3030/confirmBraintree`, data)
                  .subscribe((data: any) => {
                    this.token = data.data;
                    if (data.status === 'Enter two numbers') {
                      // this.enterTwoNumber = true;
                    }
                    this.route.navigate(['/pay']);
                  });
                // console.log('value of nonce', tokenizedPayload.nonce);
              }
            );
          }
        );
      }
    );

    // console.log('chmbilaw nonce', this.nounce);
  };

  // step send two numbers to the server
  finalPay(fNumber: any, sNumber: any) {
    console.log('final amnoutn', this.amountInput);
    return this.http
      .post(`http://localhost:3030/finalpay`, {
        x: fNumber,
        y: sNumber,
        amount: this.amountInput,
      })
      .subscribe((data: any) => {
        this.token = data.data;
        if (data.status === 'Fail') {
          this.countRetry += 1;
          if (this.countRetry < 5) {
            alert('please enter two numbers correctly');
          } else {
            this.route.navigate(['/']);
          }
        } else {
          alert(data.status);
          this.route.navigate(['/']);
        }
        // calling function to call braintree & get nonce
        // this.createBraintree();
        console.log('finalPay', data.status);
      });
  }
}
