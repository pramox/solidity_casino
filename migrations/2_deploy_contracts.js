const CasinoToken = artifacts.require("CasinoToken");
const Casino = artifacts.require("Casino");

// Deploys the CasinoToken and Casino contract.
// Here you can also pass constructor variables.
// See more on https://trufflesuite.com/docs/truffle/how-to/contracts/run-migrations/#deployerdeploycontract-args-options
module.exports = function(deployer) {
    deployer.deploy(CasinoToken, 'name', 'symbol');
    deployer.deploy(Casino, 100);
};
