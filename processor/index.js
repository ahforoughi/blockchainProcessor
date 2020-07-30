const { TransactionProcessor } = require("sawtooth-sdk/processor");
const Blockchain98Handler = require("./Handler");
require("dotenv").config();

/* if (process.argv.length < 3) {
    console.log('Missing a Validator Address!')
    process.exit(1)
} */

const address = process.env.ADDRESS;

const transactionProcessor = new TransactionProcessor(address);

transactionProcessor.addHandler(new Blockchain98Handler());

transactionProcessor.start();
