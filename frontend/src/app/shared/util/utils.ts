import {MessageService} from "primeng/api";
import Web3 from "web3";

/**
 * Extending globally available window variable with web3 field to easy usage by components and to be independent of the service.
 */
declare global {
    interface Window {
        web3: Web3;
    }
}
window.web3 = window.web3 || {};


export interface CallOptions {
    from: string,
    method: any,
    value?: any,
}

/**
 * Util method to handle gas estimation and error handling for contract calls.
 * @param from              sender address
 * @param method            contract method
 * @param value             optional ether value to send
 * @param messageService    instance of the PrimeNG MessageService to add toast messages
 */
export function callContractMethodWithMessage({from, method, value = 0}: CallOptions, messageService: MessageService) {
    try {
        method.estimateGas({from: from, value: value}, (error: any, result: any) => {
            if (error) {
                messageService.add(errorMessage(error));
            } else {
                method.send({from: from, value: value, gas: result}).then((result: any) => {
                        messageService.add(transactionSuccess(result));
                    }
                );
            }
        }).catch((e: any) => {
            messageService.add(errorMessage(e));
        });
    } catch (e: any) {
        messageService.add(errorMessage(e));
    }
}

export function transactionSuccess(receipt: any) {
    return {severity: 'success', summary: 'Transaction sent', detail: receipt.transactionHash};
}

export function errorMessage(message: string) {
    return {severity: 'error', summary: 'Error', detail: message};
}

export function compareAddresses(addressA: string, addressB: string) {
    return addressA.toUpperCase() === addressB.toUpperCase();
}