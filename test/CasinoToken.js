const truffleAssert = require('truffle-assertions');

const CasinoToken = artifacts.require("CasinoToken");
const DefinitelyNotATokenReceiver = artifacts.require("Migrations");

contract("CasinoToken test", async accounts => {
    let owner = accounts[0];
    let partygoer = accounts[1];

    it("should have a name", async () => {
        let instance = await CasinoToken.deployed();
        let name = await instance.name.call();
        assert.notEqual(name, "");
    })

    it("should have a symbol", async () => {
        let instance = await CasinoToken.deployed();
        let symbol = await instance.symbol.call();
        assert.notEqual(symbol, "");
    })

    it("should be indivisible", async () => {
        let instance = await CasinoToken.deployed();
        let decimals = await (instance.decimals.call()).valueOf();
        assert.equal(decimals, 0);
    });

    it("should be mintable", async () => {
        let instance = await CasinoToken.deployed();
        let amount1 = (await instance.totalSupply.call()).toNumber();
        let result = await instance.mint(owner, 100);
        truffleAssert.eventEmitted(result, 'Transfer');
        let amount2 = (await instance.totalSupply.call()).toNumber();
        assert.equal(amount2 - amount1, 100);
    });

    it("should not be mintable by someone else", async () => {
        let instance = await CasinoToken.deployed();
        await truffleAssert.reverts(instance.mint(owner, 100, {'from': partygoer}));
    });

    it("should be burnable", async () => {
        let instance = await CasinoToken.deployed();
        await instance.mint(partygoer, 10);
        let amount1 = (await instance.balanceOf.call(partygoer)).toNumber();
        await instance.burn(10, {'from': accounts[1]});
        let amount2 = (await instance.balanceOf.call(partygoer)).toNumber();
        assert.equal(amount1 - amount2, 10);
    });

    it("tokens are transferred correctly", async () => {
        let instance = await CasinoToken.deployed();
        await instance.mint(owner, 100);
        let balanceBefore = (await instance.balanceOf(partygoer)).toNumber();
        let tx = await instance.transfer(partygoer, 50, {'from': owner});
        truffleAssert.eventEmitted(tx, 'Transfer');
        let balanceAfter = (await instance.balanceOf(partygoer)).toNumber();
        assert.equal(balanceAfter - balanceBefore, 50)
    });

    it("tokens are not transferred to contracts that cannot handle it", async () => {
        let instance = await CasinoToken.deployed();
        let definitelyNotATokenReceiver = await DefinitelyNotATokenReceiver.deployed();
        await instance.mint(owner, 100);
        await truffleAssert.reverts(instance.transfer(definitelyNotATokenReceiver.address, 50, {'from': owner}));
    })
});

