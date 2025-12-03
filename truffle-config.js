/**
 * Truffle Configuration for Blockchain Healthcare Project
 * Connects to Ganache local blockchain
 */

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",   // Ganache RPC server
      port: 7545,          // Ganache GUI default port
      network_id: "*",     // Match any network id
    },
  },

  // Compiler configuration
  compilers: {
    solc: {
      version: "0.8.20",  // Solidity version
      settings: {
        optimizer: {
          enabled: true,  // Enable optimization
          runs: 200
        },
      },
    },
  },

  // Mocha testing options
  mocha: {
    timeout: 100000  // 100 seconds for tests
  },

  // Truffle DB disabled (not needed for now)
  db: {
    enabled: false
  }
};
