import { ethers } from "ethers";
import { Ballot__factory } from "../typechain-types/factories";
import * as dotenv from "dotenv";
dotenv.config();

const PROPOSALS = ["proposal_1", "proposal_2", "proposal_3"];
const shambuAddress = "0x0926519a5C3c7e9b9938b052Ee41118FBe6ef56F";
const denAddress = "0xa0a2206F78CAbdf6d5770F5f8B617774F699F69A";

const bytes32toString = (arr: string[]) => {
  return arr.map(ethers.utils.formatBytes32String);
};

async function deploy(proposals: string[]) {
  const provider = new ethers.providers.AlchemyProvider("goerli", process.env.ALCHEMY_API_KEY);
  const privateKey = process.env.PRIVATE_KEY_GOERLI ?? "";
  const wallet = new ethers.Wallet(privateKey);
  console.log(`Connected to wallet: ${wallet.address}`);

  // check we're connected to Goerli network with this check
  const lastBlock = await provider.getBlock("latest");
  console.log("lastBlock", lastBlock);

  // Signer
  const signer = wallet.connect(provider);
  const balance = await signer.getBalance();
  console.log("balance", balance);

  const BallotContractFactory = new Ballot__factory(signer);
  // const BallotContractFactory = new ethers.ContractFactory("Ballot");
  const ballotContract = await BallotContractFactory.deploy(bytes32toString(PROPOSALS), {
    gasLimit: 5000000,
  });
  const txReceipt = await ballotContract.deployTransaction.wait();

  // Deployed contract
  console.log(`Deployed ballot contract to address: ${await ballotContract.address}`);
  console.log(`Deployed ballot contract at block number: ${await txReceipt.blockNumber}`);

  // Check chairman address
  const chairperson = await ballotContract.chairperson();
  console.log(`Chairperson address: ${chairperson}`);

  // Give signer1 and signer2 voting rights
  const giveRightToVoteTx1 = await ballotContract.giveRightToVote(shambuAddress);
  const giveRightToVoteTxReceipt1 = await giveRightToVoteTx1.wait();
  const giveRightToVoteTx2 = await ballotContract.giveRightToVote(denAddress);
  const giveRightToVoteTxReceipt2 = await giveRightToVoteTx2.wait();
  console.log(`Give address1 right to vote in block: ${await giveRightToVoteTxReceipt1.blockHash}`);
  console.log(`Give address2 right to vote in block: ${await giveRightToVoteTxReceipt2.blockHash}`);

  // Check voter 1 and voter 2
  const voter1 = await ballotContract.voters(shambuAddress);
  console.log("voter1", voter1);
  const voter2 = await ballotContract.voters(denAddress);
  console.log("voter2", voter2);

  // Winner right now?
  const winner_t1 = await ballotContract.winningProposal();
  console.log("winner t1:", winner_t1);
}

deploy(PROPOSALS).catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
