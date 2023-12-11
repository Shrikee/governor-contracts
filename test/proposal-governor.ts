import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumberish, ContractTransactionResponse } from 'ethers';
import { ProposalGovernor, TimeLock, VoteToken } from '../typechain-types';

describe('ProposalGovernor', () => {
  let proposalId: BigNumberish;
  let voteToken: VoteToken & {
    deploymentTransaction(): ContractTransactionResponse;
  };
  let timeLock: TimeLock & {
    deploymentTransaction(): ContractTransactionResponse;
  };
  let proposalGovernor: ProposalGovernor & {
    deploymentTransaction(): ContractTransactionResponse;
  };
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    const { owner, otherAccount, voter } = await getSigners();

    const VoteToken = await ethers.getContractFactory('VoteToken');
    const TimeLock = await ethers.getContractFactory('TimeLock');
    const ProposalGovernor = await ethers.getContractFactory(
      'ProposalGovernor',
    );

    if (!voteToken) {
      voteToken = await VoteToken.deploy();
      await voteToken.waitForDeployment();
      await voteToken.transfer(voter.address, ethers.parseEther('0.5'));
    }

    if (!timeLock) {
      timeLock = await TimeLock.deploy('0', [], [], ethers.ZeroAddress);
      await timeLock.waitForDeployment();
    }

    if (!proposalGovernor) {
      proposalGovernor = await ProposalGovernor.deploy(
        voteToken.target,
        timeLock.target,
      );
      await proposalGovernor.waitForDeployment();
    }

    return { voteToken, timeLock, proposalGovernor };
  }

  async function getSigners() {
    const [owner, otherAccount, voter] = await ethers.getSigners();

    return { owner, otherAccount, voter };
  }

  describe('Deployment', function () {
    it('Should add proposal', async () => {
      const { voteToken, proposalGovernor } = await loadFixture(
        deployContracts,
      );
      const { owner, otherAccount } = await getSigners();

      const transferCalldata = voteToken.interface.encodeFunctionData(
        'transfer',
        [otherAccount.address, '1000'],
      );
      const description = '1. Transfer vote tokens to other address';

      const tx = await proposalGovernor.propose(
        [voteToken.target],
        ['0'],
        [transferCalldata],
        description,
      );

      await tx.wait();

      const filter = proposalGovernor.filters.ProposalCreated();
      const createProposalEvent = await proposalGovernor.queryFilter(filter);

      proposalId = createProposalEvent[0].args[0];

      const proposer = await proposalGovernor.proposalProposer(proposalId);

      const calldataFromLog = createProposalEvent[0].args.filter(
        (el) => el == transferCalldata,
      );

      const descriptionFromLog = createProposalEvent[0].args.filter(
        (el) => el == description,
      );

      expect(transferCalldata).to.be.eq(calldataFromLog[0].toString());
      expect(description).to.be.eq(descriptionFromLog[0]);
      expect(proposer).to.be.eq(owner.address);
    });

    it('should vote for proposal', async () => {
      const { proposalGovernor } = await deployContracts();
      const { voter } = await getSigners();
      // if voting type set to * - `support=bravo` refers to the vote options 0 = Against, 1 = For, 2 = Abstain
      const tx = await proposalGovernor.connect(voter).castVote(proposalId, 1);
      await tx.wait();

      const hasVoted = await proposalGovernor.hasVoted(
        proposalId,
        voter.address,
      );

      expect(hasVoted).to.be.true;
    });
  });
});
