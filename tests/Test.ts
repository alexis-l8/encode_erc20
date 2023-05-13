import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  MyERC20,
  MyERC20__factory,
  MyERC721,
  MyERC721__factory,
  TokenSale,
  TokenSale__factory,
} from "../typechain-types";

const TEST_RATIO = 5;
const NFT_PRICE = ethers.utils.parseEther("0.1");

describe("NFT Shop", async () => {
  let accounts: SignerWithAddress[];
  let tokenSaleContract: TokenSale;
  let paymentTokenContract: MyERC20;
  let nftContract: MyERC721;
  let erc20ContractFactory: MyERC20__factory;
  let erc721ContractFactory: MyERC721__factory;
  let tokenSaleContractFactory: TokenSale__factory;

  beforeEach(async () => {
    [accounts, erc20ContractFactory, erc721ContractFactory, tokenSaleContractFactory] =
      await Promise.all([
        ethers.getSigners(),
        ethers.getContractFactory("MyERC20"),
        ethers.getContractFactory("MyERC721"),
        ethers.getContractFactory("TokenSale"),
      ]);
    paymentTokenContract = await erc20ContractFactory.deploy();
    await paymentTokenContract.deployed();
    nftContract = await erc721ContractFactory.deploy();
    await nftContract.deployed();
    tokenSaleContract = await tokenSaleContractFactory.deploy(
      TEST_RATIO,
      NFT_PRICE,
      paymentTokenContract.address,
      nftContract.address
    );
    await tokenSaleContract.deployed();
    const MINTER_ROLE = await paymentTokenContract.MINTER_ROLE();
    const roleTX = await paymentTokenContract.grantRole(MINTER_ROLE, tokenSaleContract.address);
    await roleTX.wait();
    const roleTX2 = await nftContract.grantRole(MINTER_ROLE, tokenSaleContract.address);
    await roleTX2.wait();
  });

  describe("When the Shop contract is deployed", async () => {
    it("defines the ratio as provided in parameters", async () => {
      const ratio = await tokenSaleContract.ratio();
      expect(ratio).to.eq(TEST_RATIO);
    });

    it("uses a valid ERC20 as payment token", async () => {
      const paymentAddress = await tokenSaleContract.paymentToken();
      const paymentContract = erc20ContractFactory.attach(paymentAddress);
      await expect(paymentContract.balanceOf(accounts[0].address)).not.to.be.reverted;
      await expect(paymentContract.totalSupply()).not.to.be.reverted;
    });
  });

  describe("When a user purchases an ERC20 from the Token contract", async () => {
    const buyValue = ethers.utils.parseEther("1");
    let ethBalanceBefore: BigNumber;
    let gasCosts: BigNumber;

    beforeEach(async () => {
      ethBalanceBefore = await accounts[1].getBalance();
      const tx = await tokenSaleContract.connect(accounts[1]).buyTokens({ value: buyValue });
      const txReceipt = await tx.wait();
      const gasUsed = txReceipt.gasUsed;
      const pricePerGas = txReceipt.effectiveGasPrice;
      gasCosts = gasUsed.mul(pricePerGas);
    });

    it("charges the correct amount of ETH", async () => {
      const ethBalanceAfter = await accounts[1].getBalance();
      const diff = ethBalanceBefore.sub(ethBalanceAfter);
      const expectDiff = buyValue.add(gasCosts);
      const error = diff.sub(expectDiff);
      expect(error).to.eq(0);
    });

    it("gives the correct amount of tokens", async () => {
      const tokenBalance = await paymentTokenContract.balanceOf(accounts[1].address);
      const expectedBalance = buyValue.div(TEST_RATIO);
      expect(tokenBalance).to.eq(expectedBalance);
    });

    describe("When a user burns an ERC20 at the Token contract", async () => {
      beforeEach(async () => {
        const expectedBalance = buyValue.div(TEST_RATIO);
        const allowTx = await paymentTokenContract
          .connect(accounts[1])
          .approve(tokenSaleContract.address, expectedBalance);
        await allowTx.wait();
        const burnTx = await tokenSaleContract.connect(accounts[1]).returnTokens(expectedBalance);
        await burnTx.wait();
      });

      it("gives the correct amount of ETH", async () => {
        throw new Error("Not implemented");
      });

      it("burns the correct amount of tokens", async () => {
        const balanceAfterBurn = await paymentTokenContract.balanceOf(accounts[1].address);
        expect(balanceAfterBurn).to.eq(0);
      });
    });

    describe("When a user purchases a NFT from the Shop contract", async () => {
      beforeEach(async () => {
        const allowTx = await paymentTokenContract
          .connect(accounts[1])
          .approve(tokenSaleContract.address, NFT_PRICE);
        await allowTx.wait();
        const mintTx = await tokenSaleContract.connect(accounts[1]).buyNFT(0);
        await mintTx.wait();
      });
      it("charges the correct amount of ETH", async () => {
        throw new Error("Not implemented");
      });

      it("gives the correct NFT", async () => {
        const nftOwner = await nftContract.ownerOf(0);
        expect(nftOwner).to.eq(accounts[1].address);
      });
    });
  });

  describe("When a user burns their NFT at the Shop contract", async () => {
    it("gives the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When the owner withdraw from the Shop contract", async () => {
    it("recovers the right amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });

    it("updates the owner pool account correctly", async () => {
      throw new Error("Not implemented");
    });
  });
});
