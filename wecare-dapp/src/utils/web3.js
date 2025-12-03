import Web3 from "web3";
import PatientRecordsJSON from "../contracts/PatientRecords.json";

/**
 * Load web3, request accounts, and return { web3, accounts, contract }
 * It tries to get contract address from the ABI's networks[networkId].
 * If that doesn't exist, it looks for REACT_APP_CONTRACT_ADDRESS environment variable.
 */
export async function loadWeb3AndContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found. Install MetaMask and connect to Ganache network.");
  }

  const web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const accounts = await web3.eth.getAccounts();
  const networkId = await web3.eth.net.getId();

  let contractAddress = null;
  if (PatientRecordsJSON.networks && PatientRecordsJSON.networks[networkId]) {
    contractAddress = PatientRecordsJSON.networks[networkId].address;
  }
  // fallback: env var (create .env with REACT_APP_CONTRACT_ADDRESS)
  if (!contractAddress && process.env.REACT_APP_CONTRACT_ADDRESS) {
    contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  }
  if (!contractAddress) {
    throw new Error(`Contract not found on network ${networkId}. Please check migrations and ABI networks or set REACT_APP_CONTRACT_ADDRESS in .env`);
  }

  const contract = new web3.eth.Contract(PatientRecordsJSON.abi, contractAddress);
  return { web3, accounts, contract };
}
