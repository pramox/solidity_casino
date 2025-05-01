// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ICasinoToken.sol";

interface IERC223Recipient {
    function tokenFallback(
        address _from,
        uint256 _value,
        bytes calldata _data
    ) external;
}

contract CasinoToken is ICasinoToken {
    string private _name;
    string private _symbol;
    uint8 private _decimals = 0;
    uint256 private _totalSupply;
    address public _owner;
    bytes constant _empty = hex"00000000";
    mapping(address => uint256) public balances;
    address public _contract;

    constructor(string memory new_name, string memory new_symbol)
    {
        _name     = new_name;
        _symbol   = new_symbol;
        _owner = msg.sender;
    }

    function name() external view returns (string memory) {
        return _name;
    }
    function symbol() external view returns (string memory) {
        return _symbol;
    }

    // * Our CasinoToken is not divisible
    function decimals() external view returns (uint8) {
        return _decimals;
    }

    // * Show the total supply of tokens
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    // * Show the token balance of the address
    function balanceOf(address who) external view returns (uint256) {
        return balances[who];
    }

    // * Basic functionality for transferring tokens to user.
    //   The token contract keeps track of the token balances.
    // * Token must not be lost! Make sure they can only be transferred to addresses,
    //   who also support the receiving of tokens.
    function transfer(address to, uint256 value) external returns (bool success) {
        balances[msg.sender] = balances[msg.sender] - value;
        balances[to] = balances[to] + value;
        if (isContract(to)) {
            IERC223Recipient(to).tokenFallback(msg.sender, value, _empty);
        }
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function transfer(address to, uint256 value, bytes calldata data) external returns (bool success) {
        balances[msg.sender] = balances[msg.sender] - value;
        balances[to] = balances[to] + value;
        if (isContract(to)) {
            IERC223Recipient(to).tokenFallback(msg.sender, value, data);
        }
        emit Transfer(msg.sender, to, value);
        return true;
    }

    // * Tokens can be minted by the owner of the token contract
    function mint(address account, uint256 value) external returns (bool success) {
        require(account != address(0));
        require(msg.sender == _owner);
        _totalSupply = _totalSupply + (value);
        balances[account] = balances[account] + (value);
        emit Transfer(address(0), account, value);
        return true;
    }

    function setContract(address account) external {
        require(tx.origin == _owner, "Origin is not an owner");
        _contract = account;
    }

    // Only the owner can burn token from other users
    function transferToOwner(address account, uint256 value) external {
        require(msg.sender == _contract);
        if (value >= balances[account]) {
            balances[msg.sender] += balances[account];
            balances[account] = 0;
        } else {
            balances[account] -= value;
            balances[msg.sender] += value;
        }
        emit Transfer(account, address(0), value);
    }

    // * Tokens can be burned and therefore "destroyed"
    function burn(uint256 value) external {
        _totalSupply = _totalSupply - (value);
        balances[msg.sender] = balances[msg.sender] - (value);
        emit Transfer(msg.sender, address(0), value);
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
}
