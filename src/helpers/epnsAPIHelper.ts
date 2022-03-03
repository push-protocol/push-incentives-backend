import { ethers } from 'ethers';


module.exports = {
  getInteractableContracts: (network: any, apiKeys:any, walletPK: any, deployedContract: any, deployedContractABI: any) => {

    const provider = ethers.getDefaultProvider(network, {
      etherscan: apiKeys.etherscanAPI ? apiKeys.etherscanAPI : null,
      infura: apiKeys.infuraAPI
        ? { projectId: apiKeys.infuraAPI.projectID, projectSecret: apiKeys.infuraAPI.projectSecret }
        : null,
      alchemy: apiKeys.alchemyAPI ? apiKeys.alchemyAPI : null,
      quorum: 1
    });

    const contract = new ethers.Contract(deployedContract, deployedContractABI, provider);

    let contractWithSigner = null;

    if (walletPK) {
      const wallet = new ethers.Wallet(walletPK, provider);
      contractWithSigner = contract.connect(wallet);
    }

    return {
      provider: provider,
      contract: contract,
      signingContract: contractWithSigner,
    };
  },
  // HELPER FUNCTION
  // Return Address Without Padding
  addressWithoutPadding: function (paddedAddress) {
    return paddedAddress.replace("0x000000000000000000000000", "0x");
  }
}
