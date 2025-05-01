// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./CasinoToken.sol";
import "./ICasino.sol";


contract Casino is IERC223Recipient, ICasino {

    bool internal _isGameOngoing;
    bool internal _isOpen;

    // token
    uint public tokenPrice;
    uint256 public tokenSupply;
    address public tokenAddress;
    mapping(address => uint) tokens;

    //betting variables
    uint constant MINBET = 10;
    uint constant MAXBET = 100;

    struct Bet {
        uint256 hash;
        bool revealed;
        uint tokens;
    }

    mapping(address => Bet) bets;
    address[] public bettingAddresses;

    //commit-reveal Phases
    Phase public commitPhase;
    enum Phase {
        COMMIT,
        REVEAL,
        DEALERBET
    }
    uint internal blockNumber;
    bool public isHeads;
    string public latestCoinFlip = "None";

    //role management
    mapping(address => Role) internal _roles;
    enum Role {
        CUSTOMER,
        OWNER,
        DEALER
    }

    constructor(uint _tokenPrice) {
        _roles[msg.sender] = Role.OWNER;
        tokenPrice = _tokenPrice;
    }

    function addOwner(address account) external onlyOwner {
        _roles[account] = Role.OWNER;
        emit OwnerAdded(account);
    }

    function isOwner(address account) external view returns (bool) {
        return _roles[account] == Role.OWNER;
    }

    function renounceOwner() external onlyOwner {
        _roles[msg.sender] = Role.CUSTOMER;
        emit OwnerRemoved(msg.sender);
    }

    function addDealer(address account) external onlyOwner {
        _roles[account] = Role.DEALER;
        emit DealerRemoved(account);
    }

    function isDealer(address account) external view returns (bool) {
        return _roles[account] == Role.DEALER;
    }

    function removeDealer(address account) external onlyOwner {
        _roles[account] = Role.CUSTOMER;
        emit DealerRemoved(account);
    }

    function renounceDealer() external onlyDealer {
        _roles[msg.sender] = Role.CUSTOMER;
        emit DealerRemoved(msg.sender);
    }

    function isCustomer(address account) external view returns (bool) {
        return _roles[account] == Role.CUSTOMER;
    }

    function getTokenAmount(address account) external view returns (uint) {
        return tokens[account];
    }

    function openCasino() external onlyDealer {
        _isOpen = true;
    }

    function closeCasino() external onlyDealer casinoOpen {
        _isOpen = false;
    }

    function casinoIsOpen() external view returns (bool) {
        return _isOpen;
    }

    function getTokenAddress() external view returns (address) {
        return tokenAddress;
    }

    function setTokenAddress(address addr) external onlyOwner {
        require(!_isOpen);
        tokenAddress = addr;
        CasinoToken tok = CasinoToken(addr);
        tok.setContract(address(this));
    }

    function setTokenPrice(uint newPrice) external onlyOwner {
        tokenPrice = newPrice;
    }

    function getTokenPrice() external view returns (uint) {
        return tokenPrice;
    }

    // Functions for betting
    // Gambler can bet with hash, so Dealer doesn't see
    function commit(uint256 hash, uint numberOfTokens) external casinoOpen {
        require(commitPhase == Phase.COMMIT, "Commit phase has to be ongoing to set a Bet");
        require(_roles[msg.sender] != Role.DEALER);
        require(bets[msg.sender].hash == 0);
        require(numberOfTokens >= MINBET, "You have to bet more token");
        require(numberOfTokens <= MAXBET, "You have to bet less token");
        CasinoToken token = CasinoToken(tokenAddress);
        uint balance = token.balanceOf(msg.sender);
        require(balance >= numberOfTokens, "too little balance");

        token.transferToOwner(msg.sender, numberOfTokens);
        bettingAddresses.push(msg.sender);
        bets[msg.sender] = Bet(hash, false, numberOfTokens);
    }

    function stopCommitPhase() external onlyDealer casinoOpen {
        require(commitPhase == Phase.COMMIT, "Commit phase has to be ongoing");
        commitPhase = Phase.DEALERBET;
    }

    function forceStartCommitPhase() external onlyDealer casinoOpen {
        require(commitPhase != Phase.COMMIT, "Phase is already commit phase");
        for (uint i = 0; i < bettingAddresses.length; i++) {
            bets[bettingAddresses[i]] = Bet(0,false,0);
        }
        commitPhase = Phase.COMMIT;
    }

    // Only dealer can set the CoinFlip value, without knowing the customers bets
    function setCoinFlipValue(bool _isHeads) external onlyDealer casinoOpen {
        require(commitPhase == Phase.DEALERBET, "Phase has to be Dealerbet phase");
        isHeads = _isHeads;
        latestCoinFlip = _isHeads ? "Heads" : "Tails";
        commitPhase = Phase.REVEAL;
    }

    function getLastCoinFlip() external view returns (string memory) {
        return latestCoinFlip;
    }

    function reveal(uint salt, bool _isHeads) external casinoOpen {
        require(commitPhase == Phase.REVEAL);
        Bet storage bet = bets[msg.sender];
        require(!bet.revealed, "Bet already revealed");
        require(bet.hash != 0);
        require(bet.tokens > 0, "No token placed");

        uint256 commitHash = bets[msg.sender].hash;
        uint256 newHash = uint256(keccak256(abi.encodePacked(salt, _isHeads)));

        require(commitHash == newHash, "Hashes are not matching");

        if (isHeads == _isHeads) {
            payoutWonCoinFlip(msg.sender);
        }
        bets[msg.sender] = Bet(0, true, 0);
    }

    function payoutWonCoinFlip(address winner) internal {
        uint256 wonToken = (bets[winner].tokens * 10) * 18;
        wonToken = wonToken / 100;
        CasinoToken token = CasinoToken(tokenAddress);
        token.transfer(winner, wonToken);
    }

    function buyToken() external payable {
        uint256 tokenAmount = msg.value / tokenPrice;
        require(tokenAmount > 0, "You have to deposit more to receive a token");
        require(tokenAmount <= tokenSupply, "Not enough supply of token");
        CasinoToken token = CasinoToken(tokenAddress);
        token.transfer(msg.sender, tokenAmount);
        tokenSupply -= tokenAmount;
        tokens[msg.sender] += tokenAmount;
    }

    function tokenFallback(address _from, uint256 _value, bytes calldata _data) external {
        require(msg.sender == tokenAddress, "Token has to be the specified one");
        if (keccak256(bytes("supply")) == keccak256(_data)) {
            require(_roles[_from] == Role.OWNER, "Only an owner can deliver supply");
            tokenSupply += _value;
        }
    }

    function payOutEther(uint value) external onlyOwner {
        require(address(this).balance >= value);
        payable(msg.sender).transfer(value);
    }

    function cashOutTokens(uint tokenAmount) external {
        CasinoToken token = CasinoToken(tokenAddress);
        require(token.balanceOf(msg.sender) >= tokenAmount, "You don't have enough tokens");
        uint valueToSend = tokenAmount * tokenPrice;
        valueToSend = (valueToSend * 8) / 10;
        require(address(this).balance >= valueToSend, "Contract does not have enough ether to pay out. Try again another time");
        payable(msg.sender).transfer(valueToSend);
        tokenSupply += tokenAmount;
        token.transferToOwner(msg.sender, tokenAmount);
    }

    modifier onlyOwner() {
        require(_roles[msg.sender] == Role.OWNER, "Only an owner can call this function");
        _;
    }
    modifier onlyDealer() {
        require(_roles[msg.sender] == Role.DEALER, "Only a dealer can call this function");
        _;
    }
    modifier casinoOpen() {
        require(_isOpen, "Casino has to be open");
        _;
    }
}