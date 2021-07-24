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

  createBraintree = (inputs: any) => {
    console.log('inputs', inputs);
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
              bankDetails.firstName = 'Amanuel';
              bankDetails.lastName = 'Mecha';
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
                  console.log(
                    'There was an error tokenizing the bank details.'
                  );
                  throw tokenizeErr;
                }
                // Submit tokenizedPayload.nonce to your server as you would
                // other payment method nonces.
                this.http
                  .post(`http://localhost:3030/confirmBraintree`, {
                    nonce: tokenizedPayload.nonce,
                  })
                  .subscribe((data: any) => {
                    this.token = data.data;
                    if (data.status === 'Enter two numbers') {
                      this.enterTwoNumber = true;
                    }
                    this.route.navigate(['/pay']);
                    // //calling function to call braintree & get nonce
                    // this.createBraintree();
                    console.log('data.status', this.enterTwoNumber);
                    // alert(data.status);
                  });
                console.log('value of nonce', tokenizedPayload.nonce);
              }
            );
          }
        );
      }
    );

    console.log('chmbilaw nonce', this.nounce);
  };
  // step send two numbers to the server
  finalPay(fNumber: any, sNumber: any, amount: any) {
    return this.http
      .post(`http://localhost:3030/finalpay`, {
        x: fNumber,
        y: sNumber,
        amount: amount,
      })
      .subscribe((data: any) => {
        this.token = data.data;
        // calling function to call braintree & get nonce
        // this.createBraintree();
        console.log('finalPay', data.status);
        alert(data.status);
        this.route.navigate(['/']);
      });
  }
}
