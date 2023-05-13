// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MyERC20.sol";
import "./MyERC721.sol";

contract TokenSale is Ownable {
    uint256 public ratio;
    uint256 public price;
    MyERC20 public paymentToken;
    MyERC721 public nftContract;
    uint256 public withdrawableAmount;

    constructor(
        uint256 _ratio,
        uint256 _price,
        address _paymentToken,
        address _nftContract
    ) {
        ratio = _ratio;
        price = _price;
        paymentToken = MyERC20(_paymentToken);
        nftContract = MyERC721(_nftContract);
    }

    function buyTokens() external payable {
        uint256 amount = msg.value / ratio;
        paymentToken.mint(msg.sender, amount);
    }

    function returnTokens(uint256 amount) external {
        paymentToken.burnFrom(msg.sender, amount);
        payable(msg.sender).transfer(amount * ratio);
    }

    function buyNFT(uint256 tokenId) external {
        paymentToken.transferFrom(msg.sender, address(this), price);
        nftContract.safeMint(msg.sender, tokenId);
        withdrawableAmount += price / 2;
    }

    // TODO: Return NFT

    function withdraw(uint256 amount) external onlyOwner {
        withdrawableAmount -= amount;
        paymentToken.transfer(owner(), amount);
    }
}
