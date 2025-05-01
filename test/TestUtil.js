/**
 * Utils to test events emitted from another contract.
 *
 * The truffle tx object does not contain events that are emitted by another
 * contract during a transaction (i.e. not the one that was called directly)
 * solution: get web3 transaction receipt and look for event signature
 */

const assertEventNot = function (transaction, eventSignatureString) {
  assert.equal(
    containsEvent(transaction, eventSignatureString),
    false,
    "Expected NOT to contain event + eventSignatureString"
  );
};

const assertEvent = async function (transaction, eventSignatureString) {
  assert.equal(
    await containsEvent(transaction, eventSignatureString),
    true,
    "Expected to contain event + eventSignatureString"
  );
};

const containsEvent = async function (transaction, eventSignatureString) {
  /*
  Since we cannot use the truffle tx return object, we have to filter
  the web3 transaction object obtained via getTransactionReceipt.

  Events are stored in the tx.logs array, where the topic[0] contains
  the keccak hash of the event signature.

  https://codeburst.io/deep-dive-into-ethereum-logs-a8d2047c7371
  */

  let txHash = transaction.receipt.transactionHash;
  // The web3 object is automatically injected by truffle
  let tx = await web3.eth.getTransactionReceipt(txHash);
  let eventHash = web3.utils.sha3(eventSignatureString);

  let eventFound = false;
  for (let i = 0; i < tx.logs.length; i++) {
    let topic = tx.logs[i].topics[0];
    if (topic === eventHash) {
      eventFound = true;
      break;
    }
  }
  return eventFound;
};

module.exports= {
  assertEvent,
  assertEventNot
}