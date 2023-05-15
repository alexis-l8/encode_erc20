import { ethers } from "hardhat";
import { MyERC20Votes__factory } from "../typechain-types";

//pads a bunch of 0s to the end
const MINT_VALUE = ethers.utils.parseUnits("10");

export async function main() {
  //get accounts
  const [deployer, acc1, acc2] = await ethers.getSigners();

  // deploy MyERC20Votes contract
  const contractFactory = new MyERC20Votes__factory(deployer);
  const contract = await contractFactory.deploy();
  const deployTxReceipt = await contract.deployTransaction.wait();
  console.log(
    `Contract deployed at address: ${contract.address} at block: ${deployTxReceipt.blockNumber}`
  );

  // mint to acc1
  const mintTx = await contract.mint(acc1.address, MINT_VALUE);
  const mintTxReceipt = await mintTx.wait();
  console.log(
    `Minted ${ethers.utils.formatUnits(MINT_VALUE)} to address 1 ${acc1.address} at block ${
      mintTxReceipt.blockNumber
    }`
  );

  // balance in big number format
  const balanceBN = await contract.balanceOf(acc1.address);
  console.log(`Account 1 ${acc1.address} has ${ethers.utils.formatUnits(balanceBN)} tokens`);

  //check how many votes acc1 has. should be 0 since they have delegated to themselves
  const votes = await contract.getVotes(acc1.address);
  console.log(`Account 1 ${acc1.address} has ${ethers.utils.formatUnits(votes)} votes`);

  // time to delegate - update voting power to number of tokens held
  const delegateTx = await contract.connect(acc1).delegate(acc1.address);
  await delegateTx.wait();

  // check delegate worked by checking how many vote acc1 has after
  const votesAfter = await contract.getVotes(acc1.address);
  console.log(
    `Account 1 ${acc1.address} has ${ethers.utils.formatUnits(
      votesAfter
    )} votes after self delegation`
  );

  // transfer some tokens from acc1 to acc2
  const transferTx = await contract.connect(acc1).transfer(acc2.address, MINT_VALUE.div(2));
  await transferTx.wait();

  // check voting power of acc1 and acc2
  const voter1AfterTransfer = await contract.getVotes(acc1.address);
  console.log(
    `Account 1 ${acc1.address} has ${ethers.utils.formatUnits(
      voter1AfterTransfer
    )} votes after transferring`
  );
  const voter2AfterTransfer = await contract.getVotes(acc2.address);
  console.log(
    `Account 2 ${acc2.address} has ${ethers.utils.formatUnits(
      voter2AfterTransfer
    )} votes after transferring`
  );

  const lastBlock = await ethers.provider.getBlock("latest");
  console.log(`Current block number is ${lastBlock.number}\n`);
  let pastVotes = await contract.getPastVotes(acc1.address, lastBlock.number - 1);
  console.log("pastVotes", pastVotes);

  return contract.address;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
