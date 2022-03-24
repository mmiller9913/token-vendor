// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20{
    
    constructor() ERC20("FrogCoin", "FROG"){
        //minting 1000 tokens with 18 decimals
        _mint(msg.sender, 1000 * 10 ** 18);   
    }

}