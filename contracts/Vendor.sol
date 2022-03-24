// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./MyToken.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract Vendor is Ownable {

    //My token contract 
    MyToken myToken;
    
    //token price per ETH
    uint256 public constant tokensPerEth = 10000;

    //event that logs token purchases
    event BuyTokens(address buyer, uint256 amountOfEth, uint256 tokenAmount);

     //event that logs token sales 
    event SellTokens(address seller, uint256 amountOfEth, uint256 tokenAmount);

    constructor(address _myTokenAddress) {
        myToken = MyToken(_myTokenAddress);
    }

    function buyTokens() public payable returns (uint256){
        require(msg.value > 0, "Please send some ETH to buy tokens");
        uint256 amountToBuy = msg.value * tokensPerEth;
        //check if the Vendor Contract has enough amount of tokens for the transaction
        uint256 vendorBalance = myToken.balanceOf(address(this));
        require(vendorBalance >= amountToBuy, "The vendor contract doesn't have enough tokens in its balance.");
        //transfer tokens to the msg.sender
        (bool sent) = myToken.transfer(msg.sender, amountToBuy);
        require(sent, "Failed to transfer token to user");
        emit BuyTokens(msg.sender, msg.value, amountToBuy);
        return amountToBuy;
    }

    function sellTokens(uint256 tokenAmountToSell) public {
        //amount user is trying to sell must be > 0
        //is in wei
        require(tokenAmountToSell > 0, "Please specify an amount of tokens > 0");
        //token balance of user must be greater or equal than amount they're trying to sell
        require(myToken.balanceOf(msg.sender) >= tokenAmountToSell, "Your balance is lower than the amount of tokens you want to sell");
        //check to make sure vendor has enough ETH to do the swap
        uint256 ownerETHBalance = address(this).balance;
        uint256 amountOfEthToTransfer = tokenAmountToSell/tokensPerEth;
        require(ownerETHBalance >= amountOfEthToTransfer, "The vendor doesn't have enough funds to buy your tokens");
        //execute token transfer
        (bool sent) = myToken.transferFrom(msg.sender, address(this), tokenAmountToSell);
        require(sent, "Failed to transfer tokens from user to vendor");
        //send eth
        (sent,) = msg.sender.call{value: amountOfEthToTransfer}("");
        require(sent, "Failed to send ETH to the user in exchange for tokens");
        emit SellTokens(msg.sender, amountOfEthToTransfer, tokenAmountToSell);
    }

    //allow contract owner to withdraw all the eth
    //this eth comes from people paying for the tokens 
    function withdraw() public payable onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ether left to withdraw");
        (bool sent,) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to send user balance back to the owner");
    }

    function getContractBalance() public view returns (uint256){
        return address(this).balance;
    }
}