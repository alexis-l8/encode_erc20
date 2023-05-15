import { ethers } from "hardhat";
import { TokenizedBallot__factory } from "../typechain-types";
import { MyERC20Votes__factory } from "../typechain-types";

const PROPOSALS = ["proposal_1", "proposal_2", "proposal_3"];
//pads a bunch of 0s to the end
const MINT_VALUE = ethers.utils.parseUnits("100");
const TARGET_BLOCK_NUMBER = 6;
const bytes32toString = (arr: string[]) => {
  return arr.map(ethers.utils.formatBytes32String);
};

async function main() {
  //get accounts
  const [deployer, acc1, acc2] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`acc1 address: ${acc1.address}`);
  console.log(`acc2 address: ${acc2.address}`);

  // deploy MyERC20Votes contract
  const myERC20VotesContractFactory = new MyERC20Votes__factory(deployer);
  const myERC20VotesContract = await myERC20VotesContractFactory.deploy();
  const myERC20VotesDeployTxReceipt = await myERC20VotesContract.deployTransaction.wait();
  console.log(
    `Contract deployed at address: ${myERC20VotesContract.address} at block: ${myERC20VotesDeployTxReceipt.blockNumber}`
  );

  // deploy TokenizedBallot contract
  const tokenizedballotContractFactory = new TokenizedBallot__factory(deployer);
  const tokenizedBallotContract = await tokenizedballotContractFactory.deploy(
    bytes32toString(PROPOSALS),
    myERC20VotesContract.address,
    TARGET_BLOCK_NUMBER
  );
  const deployTxReceipt = await tokenizedBallotContract.deployTransaction.wait();
  console.log(
    `Tokenized Ballot contract deployed at address: ${tokenizedBallotContract.address} at block: ${deployTxReceipt.blockNumber}`
  );

  // check proposals
  const proposal1 = await tokenizedBallotContract.proposals(0);
  console.log("proposal1", proposal1);
  const proposal2 = await tokenizedBallotContract.proposals(1);
  console.log("proposal2", proposal2);
  const proposal3 = await tokenizedBallotContract.proposals(2);
  console.log("proposal3", proposal3);

  // mint to acc1
  const mintTx = await myERC20VotesContract.mint(acc1.address, MINT_VALUE);
  const mintTxReceipt = await mintTx.wait();
  console.log(
    `Minted ${ethers.utils.formatUnits(MINT_VALUE)} to address 1 ${acc1.address} at block ${
      mintTxReceipt.blockNumber
    }`
  );

  // balance in big number format
  const balanceBN = await myERC20VotesContract.balanceOf(acc1.address);
  console.log(`Account 1 ${acc1.address} has ${ethers.utils.formatUnits(balanceBN)} tokens`);

  //check how many votes acc1 has. should be 0 since they have delegated to themselves
  const votes = await myERC20VotesContract.getVotes(acc1.address);
  console.log(`Account 1 ${acc1.address} has ${ethers.utils.formatUnits(votes)} votes`);

  // time to delegate - update voting power to number of tokens held
  const delegateTx = await myERC20VotesContract.connect(acc1).delegate(acc1.address);
  await delegateTx.wait();

  // check delegate worked by checking how many vote acc1 has after
  const votesAfter = await myERC20VotesContract.getVotes(acc1.address);
  console.log(
    `Account 1 ${acc1.address} has ${ethers.utils.formatUnits(
      votesAfter
    )} votes after self delegation`
  );

  // transfer some tokens from acc1 to acc2
  const transferTx = await myERC20VotesContract
    .connect(acc1)
    .transfer(acc2.address, MINT_VALUE.div(2));
  await transferTx.wait();
  console.log(
    `Account 1 ${acc1.address} tranferred ${ethers.utils.formatUnits(
      MINT_VALUE.div(2)
    )} votes to Account 2 ${acc2.address}`
  );

  // check voting power of acc1 and acc2
  const voter1AfterTransfer = await myERC20VotesContract.getVotes(acc1.address);
  console.log(
    `Account 1 ${acc1.address} has ${ethers.utils.formatUnits(
      voter1AfterTransfer
    )} votes after transferring`
  );
  const voter2AfterTransfer = await myERC20VotesContract.getVotes(acc2.address);
  console.log(
    `Account 2 ${acc2.address} has ${ethers.utils.formatUnits(
      voter2AfterTransfer
    )} votes after transferring`
  );

  // acc2 self deleegate
  const delegateTx2 = await myERC20VotesContract.connect(acc2).delegate(acc2.address);
  await delegateTx2.wait();
  // check delegate worked by checking how many vote acc1 has after
  const votes2After = await myERC20VotesContract.getVotes(acc1.address);
  console.log(
    `Account 2 ${acc2.address} has ${ethers.utils.formatUnits(
      votes2After
    )} votes after self delegation`
  );

  const lastBlock = await ethers.provider.getBlock("latest");
  console.log(`Current block number is ${lastBlock.number}\n`);
  let pastVotes = await myERC20VotesContract.getPastVotes(acc1.address, lastBlock.number - 1);
  console.log("pastVotes", pastVotes);

  // acc1 to vote first time
  const voted1Proposal = 1;
  const voted1Votes = 50;
  const voted1 = await tokenizedBallotContract.connect(acc1).vote(voted1Proposal, voted1Votes);
  await voted1.wait();
  console.log(
    `Account 1 ${acc1.address} voted for proposal ${voted1Proposal} with ${voted1Votes} votes`
  );

  // check acc1 voting power spend
  const acc1VotingPowerSpent = await tokenizedBallotContract.votingPowerSpent(acc1.address);
  console.log("acc1VotingPowerSpent", acc1VotingPowerSpent);

  // check proposal 1 has 50 votes
  const checkProposal1 = await tokenizedBallotContract.proposals(0);
  console.log("proposal1", checkProposal1);
  const checkProposal2 = await tokenizedBallotContract.proposals(1);
  console.log("proposal2", checkProposal2);
  const checkProposal3 = await tokenizedBallotContract.proposals(2);
  console.log("proposal3", checkProposal3);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
