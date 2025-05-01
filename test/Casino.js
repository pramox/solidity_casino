const truffleAssert = require('truffle-assertions');
const testUtils = require('./TestUtil.js');
const BN = require('bn.js');

const CasinoToken = artifacts.require("CasinoToken");
const Casino = artifacts.require("Casino");

contract("Casino Test", async accounts => {

    let casinoToken;
    let casino;

    let owner = accounts[0];
    let dealer = accounts[1];
    let gambler = accounts[2];
    let addictedGambler = accounts[3];

    async function deployAndInit() {
        // deployed behaves like a singleton. It will look if there is already an instance of the contract deployed to the blockchain via deployer.deploy. The information about which contract has which address on which network is stored in the build folder. new will always create a new instance. [https://ethereum.stackexchange.com/questions/42094/should-i-use-new-or-deployed-in-truffle-unit-tests]
        casinoToken = await CasinoToken.new("test", "test");
        await casinoToken.mint(gambler, 50);
        await casinoToken.mint(addictedGambler, 100);

        casino = await Casino.new(100);
        await casino.setTokenAddress(casinoToken.address);
    }

    async function prepareCasino() {
        await casino.addDealer(dealer);
        await casino.openCasino({from: dealer});
        await casinoToken.setContract(casino.address);
    }

    beforeEach("deploy and init", async () => {
        await deployAndInit();
    });

    it("owner should be set", async () => {
        assert(await casino.isOwner(owner));
    });

    it("CasinoToken should be set", async () => {
        assert.equal(await casino.getTokenAddress.call(), casinoToken.address);
    });

    it("unregisterred user should be customer", async () => {
        assert(await casino.isCustomer(gambler));
    });

    it("added dealer should have dealer role", async () => {
        assert(await casino.isCustomer(dealer));
        await casino.addDealer(dealer, {from: owner});
        assert(await casino.isDealer(dealer));
    });

    it("Customer tries to add owner and dealer, should fail", async () => {
        await truffleAssert.reverts(casino.addOwner(dealer, {from: gambler}));
        await truffleAssert.reverts(casino.addDealer(dealer, {from: gambler}));
    });

    it("owner can supply", async () => {
        await casinoToken.mint(owner, 100);
        let amount1 = (await casinoToken.balanceOf.call(casino.address)).toNumber();
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});
        let amount2 = (await casinoToken.balanceOf.call(casino.address)).toNumber();
        assert.equal(amount2 - amount1, 100);
    });

    it("others cannot supply", async () => {
        await casino.addDealer(dealer);
        await casinoToken.mint(dealer, 100);
        let amount1 = (await casinoToken.balanceOf.call(casino.address)).toNumber();
        await truffleAssert.reverts(casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: dealer}));
        let amount2 = (await casinoToken.balanceOf.call(casino.address)).toNumber();
        assert.equal(amount2 - amount1, 0);

        await casinoToken.mint(gambler, 100);
        let amount3 = (await casinoToken.balanceOf.call(casino.address)).toNumber();
        await truffleAssert.reverts(casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: gambler}));
        let amount4 = (await casinoToken.balanceOf.call(casino.address)).toNumber();
        assert.equal(amount3 - amount4, 0);
    });

    it("others can buy CasinoTokens", async () => {
        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});
        await casino.setTokenPrice(10, {from: owner});

        let amountBefore = (await casinoToken.balanceOf.call(gambler)).toNumber();
        await casino.buyToken({value: 100, from: gambler});
        let amountAfterwards = (await casinoToken.balanceOf.call(gambler)).toNumber();
        assert.equal(amountAfterwards - amountBefore, 10);
        assert.equal(await casino.getTokenAmount(gambler), 10);
    });

    it("win a bet, gambler should get his tokens * 1,8", async () => {
        await prepareCasino();
        // keccak hash for salt (69) + bet (heads)
        const hash = web3.utils.soliditySha3(new BN('69'), true);

        let amountBefore = (await casinoToken.balanceOf.call(gambler)).toNumber();
        await casino.commit(hash, 20, {from: gambler});

        await casino.stopCommitPhase({from: dealer});
        await casino.setCoinFlipValue(true, {from: dealer});

        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await casino.reveal(69, true,{from: gambler});

        let amountAfter = (await casinoToken.balanceOf.call(gambler)).toNumber();
        assert.equal(amountAfter - amountBefore, 16);
    });

    it("lose a bet, gambler should lose all tokens", async () => {
        await prepareCasino();
        // keccak hash for salt (69) + bet (heads)
        const hash = web3.utils.soliditySha3(new BN('69'),true);

        let amountBefore = (await casinoToken.balanceOf.call(gambler)).toNumber();
        await casino.commit(hash, 20, {from: gambler});

        await casino.stopCommitPhase({from: dealer});
        await casino.setCoinFlipValue(false, {from: dealer});

        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await casino.reveal(69, true,{from: gambler});

        let amountAfter = (await casinoToken.balanceOf.call(gambler)).toNumber();
        assert.equal(amountAfter - amountBefore, -20);
    });

    it("commit, try different boolean after dealer bets", async () => {
        await prepareCasino();

        // keccak hash for salt (69) + bet (heads)
        const hash = web3.utils.soliditySha3(new BN('69'), true);

        await casino.commit(hash, 20, {from: gambler});
        await casino.stopCommitPhase({from: dealer});
        await casino.setCoinFlipValue(false, {from: dealer});

        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await truffleAssert.reverts(casino.reveal(69, false,{from: gambler}));
    });

    it("try reveal before committing, should revert", async () => {
        await prepareCasino();

        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await truffleAssert.reverts(casino.reveal(69, false,{from: gambler}));
    });

    it("try commit and reveal without dealer setting it's bet, should revert", async () => {
        await prepareCasino();

        const hash = web3.utils.soliditySha3(new BN('69'), true);
        await casino.commit(hash, 20, {from: gambler});
        await casino.stopCommitPhase({from: dealer});
        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await truffleAssert.reverts(casino.reveal(69, false,{from: gambler}));
    });

    it("try commit twice, should revert", async () => {
        await prepareCasino();

        const hash = web3.utils.soliditySha3(new BN('70'));
        await casino.commit(hash, 20, {from: gambler});
        await truffleAssert.reverts(casino.commit(hash, 20, {from: gambler}));
    });

    it("try reveal twice, should revert", async () => {
       await prepareCasino();

        const hash = web3.utils.soliditySha3(new BN('69'), true);
        await casino.commit(hash, 20, {from: gambler});

        await casino.stopCommitPhase({from: dealer});
        await casino.setCoinFlipValue(true, {from: dealer});

        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await casino.reveal(69, true,{from: gambler});
        await truffleAssert.reverts(casino.reveal(69, true,{from: gambler}));
    });

    it("multiplayer betting, should only let one win", async () => {
        await prepareCasino();

        const hashGambler = web3.utils.soliditySha3(new BN('69'), true);
        const hashAddictedGambler = web3.utils.soliditySha3(new BN('420'), false);

        let amountBeforeGambler = (await casinoToken.balanceOf.call(gambler)).toNumber();
        let amountBeforeAddictedGambler = (await casinoToken.balanceOf.call(addictedGambler)).toNumber();

        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await casino.commit(hashGambler, 20, {from: gambler});
        await casino.commit(hashAddictedGambler, 50, {from: addictedGambler});

        await casino.stopCommitPhase({from: dealer});
        await casino.setCoinFlipValue(true, {from: dealer});

        await casino.reveal(69, true, {from: gambler});
        await casino.reveal(420, false, {from: addictedGambler});

        let amountAfterGambler = (await casinoToken.balanceOf.call(gambler)).toNumber();
        let amountAfterAddictedGambler = (await casinoToken.balanceOf.call(addictedGambler)).toNumber();

        assert.equal(amountAfterGambler - amountBeforeGambler, 16);
        assert.equal(amountAfterAddictedGambler - amountBeforeAddictedGambler, -50);
    });

    it("pay token, user should receive token", async () => {
        let amountBefore = (await casinoToken.balanceOf.call(gambler)).toNumber();

        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await casino.buyToken({from: gambler, value: 1000});
        let amountAfter = (await casinoToken.balanceOf.call(gambler)).toNumber();
        assert.equal(amountAfter - amountBefore, 10);
    });

    it("try buy token with too little ether, should revert", async () => {
        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await truffleAssert.reverts(casino.buyToken({from: gambler, value: 50}));
    });

    it("try buy more tokens than supply, should revert", async () => {
        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});

        await truffleAssert.reverts(casino.buyToken({from: gambler, value: 100000}));
    });

    it("buy token then cashout", async () => {
        await casinoToken.mint(owner, 100);
        await casinoToken.methods['transfer(address,uint256,bytes)'](casino.address, 100, web3.utils.fromAscii("supply"), {from: owner});
        await casino.buyToken({from: gambler, value: 1000});

        let amountCasinoAfterBuy = (await casinoToken.balanceOf.call(casino.address)).toNumber();
        assert.equal(amountCasinoAfterBuy, 90);

        await casinoToken.setContract(casino.address);
        await casino.cashOutTokens(10, {from: gambler});
        let amountGambler = (await casinoToken.balanceOf.call(gambler)).toNumber();
        let amountCasino = (await casinoToken.balanceOf.call(casino.address)).toNumber();

        assert.equal(amountGambler, 50);
        assert.equal(amountCasino, 100);
    });






});