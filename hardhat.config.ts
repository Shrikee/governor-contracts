import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-tracer';
import { HardhatUserConfig } from 'hardhat/config';

const { MAINNET_URL, PK } = process.env;

const accounts = PK == undefined || PK.length === 0 ? [] : [PK];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mainnet: {
      chainId: 1,
      url:
        MAINNET_URL ||
        'https://mainnet.infura.io/v3/85e8b52ac3e543df9247a052bcb8831d',
      accounts,
    },
    local: {
      url: 'http://127.0.0.1:8545/',
    },
  },
};

export default config;
