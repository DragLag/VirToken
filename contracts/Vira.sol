// SPDX-License-Identifier: MIT
//pragma solidity ^0.8.19;
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Vira is ERC20 {
    mapping(address => uint256) public expirationTimes;
    uint256 public constant MAX_GENERATABLE = 100; 

    constructor() ERC20("Vira", "VIR") {}

    function requestTokens(uint256 duration) public {
        uint256 currentBalance = balanceOf(msg.sender);
        
        require(currentBalance < MAX_GENERATABLE, "You already have enough tokens");

        uint256 amountToMint = MAX_GENERATABLE - currentBalance;
        _mint(msg.sender, amountToMint);
        expirationTimes[msg.sender] = block.timestamp + duration;
    }

    function burnExpiredTokens() public {
        require(block.timestamp >= expirationTimes[msg.sender], "Tokens are still valid");
        _burn(msg.sender, balanceOf(msg.sender));
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(block.timestamp < expirationTimes[msg.sender], "Tokens expired");
        return super.transfer(recipient, amount);
    }
}
