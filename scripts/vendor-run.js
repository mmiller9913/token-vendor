//run with npx hardhat run scripts/vendor-run.js

const main = async () => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Deploying contract with account: ", owner.address);
    const vendorContractFactory = await hre.ethers.getContractFactory("Vendor");
    const vendorContract = await vendorContractFactory.deploy("0x53003847711905898D545704d5782328C908d8A3");
    await vendorContract.deployed();
    console.log("Contract deployed to:", vendorContract.address);
};

const runMain = async () => {
  try {
      await main();
      process.exit(0);
  } catch (error) {
      console.log(error);
      process.exit(1);
  }
};

runMain();
