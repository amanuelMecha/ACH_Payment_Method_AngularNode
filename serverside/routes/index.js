var express = require("express");
var router = express.Router();
var braintree = require("braintree");
var verificationId;
var results;
const env = require("dotenv").config();

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  // merchantId: "bgznqt4c5w7p6vpx",
  // publicKey: "79fwqgp5prsvhgmb",
  // privateKey: "4517bea90f555cbbcfc47d52942d3c4e",
  merchantId: process.env.merchantId,
  publicKey: process.env.publicKey,
  privateKey: process.env.privateKey,
});

// generate token
router.get("/initializeBraintree", async (req, res) => {
  try {
    let token = (await gateway.clientToken.generate({})).clientToken;
    res.json({ data: token });
  } catch (err) {
    res.json({ status: "operation failed" });
  }
});

router.post("/confirmBraintree", async (req, res) => {
  // console.log("asaad", req.body);
  // console.log("amanuel", req.body.nonce);
  let customerId;
  const nonceFromTheClient = req.body;
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

  gateway.usBankAccountVerification.confirmMicroTransferAmounts(
    verificationId,
    [req.body.x, req.body.y],
    (err, response) => {
      console.log("microConfirm", response);
      if (response.success) {
        //console.log(response)
        // console.log(response.usBankAccountVerification.id)

        // Looking up individual verification status

        gateway.usBankAccountVerification.find(
          response.usBankAccountVerification.id,
          (err, verification) => {
            // console.log(verification);
            const status = verification.status;
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
                  // console.log("successssss", result);
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

module.exports = router;
