import { ethers } from 'hardhat';

async function main() {
  const VoteToken = await ethers.getContractFactory('VoteToken');
  const TimeLock = await ethers.getContractFactory('TimeLock');
  const ProposalGovernor = await ethers.getContractFactory('ProposalGovernor');

  const voteToken = await VoteToken.deploy();
  await voteToken.waitForDeployment();

  console.log('voteToken: ', voteToken.target);

  const timeLock = await TimeLock.deploy('0', [], [], ethers.ZeroAddress);
  await timeLock.waitForDeployment();

  console.log('timeLock: ', timeLock.target);

  const proposalGovernor = await ProposalGovernor.deploy(
    voteToken.target,
    timeLock.target,
  );
  await proposalGovernor.waitForDeployment();

  console.log('proposalGovernor: ', proposalGovernor.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
