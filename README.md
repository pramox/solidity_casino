# Solidity Casino - Ethereum-based Casino

## Overview

**Solidity Casino** is a decentralized casino built on the Ethereum blockchain where users can stake their **Ether** to participate in various games. The casino is powered by **Solidity**, a smart contract programming language for Ethereum, and has a connected frontend that allows users to interact with the smart contracts via their browser. The goal is to provide a secure and transparent way for users to stake Ether, play games, and potentially win rewards, all while taking advantage of Ethereum’s blockchain features.

## Short description of functionality: 
The problem of online-casino websites or any gambling related business: It's not public. Nor the calculation on how the probability is distributed, nor who wins - and how much the person wins is public. (Atleast for the regular casino sites) What better way than to use a smart contract for that and implement a solidity based casino system in which you can gamble (and probably lose ;) )  all your valueable ether. Maybe you will be a millionaire soon!

## Off-chain part / frontend:
In this part you should be able to choose what casino games you want to play and how much you want to bet. Then a request will be sent to the contract, which will calculate the result of the games! You should also be able to view your balance, and play with other players (if that doesn't exceed the time spend)

## On-chain part / contracts:
In this part the ether / token distribution should take place. The logic of all games will take place there and winnings are caluclation (probably not in the favor of the user, like all casinos - maybe even worse)
I thought of a few games, like 3-5 which should be fairly easy to implement. For example: 
CoinFlip = Just pick a side and either lose all or win (almost) double
Dice games
A simplified version of blackjack
A simplified version of roulette

## Token concept / standards:
For every game you will not gamble with ether itself but with CasinoTokens. Usage of in-website currency is usually the go to for casino sites, instead of displaying the real cash values. This will make customers even more addicted and earns us more money! For every game there will be a max / min betting value of tokens. 

## Ether usage:
Users can buy tokens with ether and sell them if selling is currently enabled. 

## Roles:
Owner (should be able to do everything)
User (should be able to use functionalities like gamble, pay-in or pay-out)
Dealer (should be able to update start games and other intern functions) 

## Data structures:
mapping (address => uint256) tokens, maybe some data structure that should hold wheter games are activated (maybe a mapping), more will be added during the implementation when I have explicit thoughts on how to execute the implementation

## Security considerations:
Solidity version > 0.8, make sure to be careful with calling other contracts (delegatecall vulernability/ reentrancy), caluclation of winnings will always be on the contracts, maybe a commit-reaveal scheme for some games (depending on the games I am going to choose)

## Used coding patterns in addition to roles (randomness, commitments, timeouts, deposits or other):
Randomness, deposits for tokens


---

# HOWTO

This repository contains an initialized Truffle project.

Run `npm install` to install all dependencies.

Recommended web3.js version: v1.9.0

## Truffle Development

Implement your contracts in the `contracts/` folder. You can compile them with `npm run compile`.
Update your migration scripts as well as needed under `migrations/`.

Implement your test cases in the `tests/` folder. You can run them with `npm run test`.
The Gitlab CI is configured to run your tests on every commit.

With `npm run dev` you can start a local Truffle development chain.

## Web Frontend

### Technology Stack

You are free to implement your web interface to your liking. You can use static JavaScript files (similar to the BeerBar
Plain Version) or any other suitable framework like e.g. [Angular](https://angular.io/), [Vue](https://vuejs.org/)
or [Next.js](https://nextjs.org/).

### GitLab CI

The GitLab CI is configured similar to the Beer Bar project. It will build your frontend and deploy it to your GitLab
Pages instance <https://final.pages.sc.logic.at/e12022511>.   
For doing so, it assumes the frontend root to be directly under `/frontend` and a proper build script available via
`npm run build` producing a production ready build under `frontend/build`.

Of course, you can adjust that to your liking.

### ABIs

Furthermore, every frontend needs the contract ABIs for interaction. Similar to the Beer Bar project
a script `npm run coco` is available in `package.json`, that will compile your contracts
and copies the artifacts to `/frontend/src/abi`.  
However, you can directly specify another output path for the contract artifacts in `truffle-config.js`.
This has the advantage, that you may not need to call `npm run coco` anymore, because then `truffle compile`
or `truffle migrate` will already output the artifacts in the specified path. You usually will call `migrate` in
the Truffle dev console anyway, when re-deploying your updated contracts.
