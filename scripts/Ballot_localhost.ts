import { ethers } from "hardhat";

const bytes32toString = (arr: string[]) => {
  return arr.map(ethers.utils.formatBytes32String);
};

async function deploy(proposals: string[]): Promise<string> {
  const BallotContractFactory = await ethers.getContractFactory("Ballot");
  const ballotContract = await BallotContractFactory.deploy(bytes32toString(proposals));

  // deployed contract
  const txReceipt = await ballotContract.deployTransaction.wait();
  console.log(`Deployed ballot contract to address: ${await ballotContract.address}`);
  console.log(`Deployed ballot contract at block number: ${await txReceipt.blockNumber}`);

  return ballotContract.address;
}

async function passAddress(contractAddress: string) {
  const BallotContractFactory = await ethers.getContractFactory("Ballot");
  const ballotContract = await BallotContractFactory.attach(contractAddress);
  return ballotContract.address;
}

async function delegateAndVote(contractAddress: string): Promise<string> {
  const BallotContractFactory = await ethers.getContractFactory("Ballot");
  const ballotContract = await BallotContractFactory.attach(contractAddress);

  // get addresses
  const [owner, signer1, signer2] = await ethers.getSigners();
  console.log(`Owner address: ${owner.address}`);
  console.log(`Address_1: ${signer1.address}`);
  console.log(`Address_2: ${signer2.address}`);

  // check chairman address
  const chairperson = await ballotContract.chairperson();
  console.log(`Chairperson address: ${chairperson}`);

  // give signer1 and signer2 voting rights
  const giveRightToVoteTx1 = await ballotContract.giveRightToVote(signer1.address);
  const giveRightToVoteTxReceipt1 = await giveRightToVoteTx1.wait();
  const giveRightToVoteTx2 = await ballotContract.giveRightToVote(signer2.address);
  const giveRightToVoteTxReceipt2 = await giveRightToVoteTx2.wait();
  console.log(`Give address1 right to vote in block: ${await giveRightToVoteTxReceipt1.blockHash}`);
  console.log(`Give address2 right to vote in block: ${await giveRightToVoteTxReceipt2.blockHash}`);

  // check voter 1 and voter 2
  const voter10 = await ballotContract.voters(signer1.address);
  console.log("voter1", voter10);
  const voter20 = await ballotContract.voters(signer2.address);
  console.log("voter2", voter20);

  // address2 delegate vote to address1
  // https://hardhat.org/tutorial/testing-contracts#using-a-different-account
  await ballotContract.connect(signer2).delegate(signer1.address);

  // check voter 1 and voter 2
  const voter11 = await ballotContract.voters(signer1.address);
  console.log("voter1", voter11);
  const voter21 = await ballotContract.voters(signer2.address);
  console.log("voter2", voter21);

  // winner time1?
  const winner_t1 = await ballotContract.winningProposal();
  console.log("winner t1:", winner_t1);

  // signer 1 votes
  await ballotContract.connect(signer1).vote(2);

  // winner time2?
  const winner_t2 = await ballotContract.winningProposal();
  console.log("winner t1:", winner_t2);

  return contractAddress;
}

async function test(contractAddress: string) {
  const BallotContractFactory = await ethers.getContractFactory("Ballot");
  const ballotContract = await BallotContractFactory.attach(contractAddress);
  console.log(`Deployed ballot contract to address: ${await ballotContract.address}`);

  // when getting a mapping, you must specify the address
  // RETURNS: Voters: 1,false,0x0000000000000000000000000000000000000000,0
  const voters = await ballotContract.voters("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  console.log(`Voters: ${voters}`);
}

const PROPOSALS = ["proposal_1", "proposal_2", "proposal_3"];

deploy(PROPOSALS)
  // passAddress("0x5FbDB2315678afecb367f032d93F642f64180aa3")
  .then((contractAddress) => delegateAndVote(contractAddress))
  .then((contractAddress) => test(contractAddress))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });

// votingRights("0x5FbDB2315678afecb367f032d93F642f64180aa3").catch((err) => {
//   console.error(err);
//   process.exitCode = 1;
// });

// STEPS:
// 1. Compile contracts: yarn hardhat clean && yarn hardhat compile
// 2. Run local network: npx hardhat node
// 3. Run script: npx hardhat run --network localhost scripts/Ballot.ts

// LOG: Deployed Ballot contract to address: 0x5FbDB2315678afecb367f032d93F642f64180aa3

// Contract deployment: Ballot
// Contract address:    0x5fbdb2315678afecb367f032d93f642f64180aa3
// Transaction:         0xfd15075be6ce52d0b78b613bb7c285c75a3c7c33d188a7e73cffb35f3e3cad86
// From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
// Value:               0 ETH
// Gas used:            1128732 of 1128732
// Block #1:            0x0a9115192b41aa01224e7bfede8ad64dfecaab4193b246c8c70020c7e1d17dc1
