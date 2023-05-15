// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./MyERC20Votes.sol";

interface IMyVoteToken {
  function getPastVotes(address, uint256) external view returns (uint256);

  function getVotes(address) external view returns (uint256);
}

contract TokenizedBallot {
  struct Proposal {
    bytes32 name;
    uint256 voteCount;
  }

  IMyVoteToken public tokenContract;
  Proposal[] public proposals;
  uint256 public targetBlockNumber;

  mapping(address => uint256) public votingPowerSpent;

  constructor(
    bytes32[] memory proposalNames,
    address _tokenContract,
    uint256 _targetBlockNumber
  ) {
    tokenContract = IMyVoteToken(_tokenContract);
    targetBlockNumber = _targetBlockNumber;
    for (uint256 i = 0; i < proposalNames.length; i++) {
      proposals.push(Proposal({name: proposalNames[i], voteCount: 0}));
    }
  }

  function vote(uint256 proposal, uint256 amount) external {
    // check they had enough voting power at target block
    require(
      tokenContract.getPastVotes(msg.sender, targetBlockNumber) >= amount
    );
    // check they have enough voting power now
    require(tokenContract.getVotes(msg.sender) >= amount);

    // check they're not trying to vote more than the tokens they can
    require(
      votingPowerSpent[msg.sender] + amount <=
        tokenContract.getPastVotes(msg.sender, targetBlockNumber)
    );

    votingPowerSpent[msg.sender] += amount;
    proposals[proposal].voteCount += amount;
  }

  function winningProposal() public view returns (uint winningProposal_) {
    uint winningVoteCount = 0;
    for (uint p = 0; p < proposals.length; p++) {
      if (proposals[p].voteCount > winningVoteCount) {
        winningVoteCount = proposals[p].voteCount;
        winningProposal_ = p;
      }
    }
  }

  function winnerName() external view returns (bytes32 winnerName_) {
    winnerName_ = proposals[winningProposal()].name;
  }
}
