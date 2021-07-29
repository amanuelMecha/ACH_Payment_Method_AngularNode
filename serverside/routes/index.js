var express = require("express");
var router = express.Router();
var braintree = require("braintree");
var verificationId;
var results;
const env = require("dotenv").config();

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.merchantId,
  publicKey: process.env.publicKey,
  privateKey: process.env.privateKey,
});

router.get("/initializeBraintree", async (req, res) => {
  try {
    let token = (await gateway.clientToken.generate({})).clientToken;
    res.json({ data: token });
  } catch (err) {
    res.json({ status: "operation failed" });
  }
});

router.post("/confirmBraintree", async (req, res) => {
  //payment method nonce = req.body
  //console.log("asaad", req.body);

  let customerId;
  const nonceFromTheClient = req.body;

  //to create customerID

  gateway.customer.create(
    {
      firstName: "Amanuel",
      lastName: "Mecha",
    },
    (err, result) => {
      if (result.success) {
        customerId = result.customer.id;

        //to verify the bank account information, specify that method here:
        gateway.paymentMethod.create(
          {
            customerId: result.customer.id,
            paymentMethodNonce: nonceFromTheClient.nonce,
            options: {
              usBankAccountVerificationMethod:
                braintree.UsBankAccountVerification.VerificationMethod
                  .MicroTransfers, //NetworkCheck or  or IndependentCheck
            },
          },
          (err, result) => {
            if (result.success) {
              results = result;
              const usBankAccount = result.paymentMethod;
              //we will use this verfication id for final payment

              verificationId = usBankAccount.verifications[0].id;

              console.log("cho result", verificationId);

              res.json({ status: "Enter two numbers" });
            }
          }
        );
      }
    }
  );
});

router.post("/finalpay", (req, res) => {
  // console.log("final payment", req.body);
  // Confirming micro-deposit amounts
  console.log("xy", req.body);

  gateway.usBankAccountVerification.confirmMicroTransferAmounts(
    verificationId,
    [req.body.x, req.body.y],

    (err, response) => {
      console.log("microConfirm", response);
      if (response.success) {
        gateway.usBankAccountVerification.find(
          response.usBankAccountVerification.id,
          (err, verification) => {
            // console.log(verification);
            const status = verification.status;
            console.log("status", status);
            if (status == "verified") {
              // ready for transacting or Creating transactions

              gateway.transaction.sale(
                {
                  amount: req.body.amount,
                  //we can't use nonceFromTheClient twice instead use this code below
                  paymentMethodToken: results.usBankAccount.token,
                  // paymentMethodNonce: nonceFromTheClientA,
                  // deviceData: deviceDataFromTheClient,
                  options: {
                    submitForSettlement: true,
                  },
                },
                (err, result) => {
                  //console.log("successssss", result);
                  if (result.success) {
                    // See result.transaction for details
                    res.json({
                      status: "successfull purchase",
                      result,
                    });
                  } else {
                    // Handle errors
                    res.json({ status: "failed", result });
                  }
                }
              );
            } else if (status == "pending") {
              res.json({ status: "pending" });
            } else {
              res.json({ status: "Fail" });
            }
          }
        );
      } else {
        res.json({ status: "Fail" });
      }
      //console.log(response)
    }
  );
});

//import   <script src="https://js.braintreegateway.com/web/3.79.1/js/payment-request.min.js"></script>

router.post("/webhooks", (req, res) => {
  console.log("req.body", req.body);
  gateway.webhookNotification.parse(
    req.body.bt_signature,
    req.body.bt_payload,
    (err, webhookNotification) => {
      console.log(
        "[Webhook Received " +
          webhookNotification.timestamp +
          "] | Kind: " +
          webhookNotification.kind
      );

      // Example values for webhook notification properties
      console.log(webhookNotification.kind); // "subscriptionWentPastDue"
      console.log(webhookNotification.timestamp); // Sun Jan 1 00:00:00 UTC 2012
      res.status(200).send();
    }
  );
  // res.json({ status: "Hello webhook" });
});

module.exports = router;
