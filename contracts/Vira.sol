// SPDX-License-Identifier: MIT
//pragma solidity ^0.8.19;
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vira is ERC20, Ownable {
    mapping(address => uint256) public expirationTimes;
    uint256 public constant MAX_GENERATABLE = 100; 
    address public authorizedAddress; 

    constructor() ERC20("Vira", "VIR")  Ownable() {
        authorizedAddress = msg.sender;
    }

    /**
     * @dev Set a new auuthorized user (Only admin can do that).
     */
    function setAuthorizedAddress(address _newAddress) public onlyOwner {
        require(_newAddress != address(0), "Address not valid");
        authorizedAddress = _newAddress;
    }

    function generateTokensForUser(address user, uint256 duration) public {
        require(msg.sender == authorizedAddress, "You are not authorized to generate tokens");
        uint256 currentBalance = balanceOf(user);
        require(currentBalance < MAX_GENERATABLE, "You already have enough tokens");
        uint256 amountToMint = MAX_GENERATABLE - currentBalance;
        _mint(user, amountToMint);
        expirationTimes[user] = block.timestamp + duration;
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
