//run with npx hardhat run scripts/vendor-run.js

const main = async () => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Deploying contract with account: ", owner.address);
    const vendorContractFactory = await hre.ethers.getContractFactory("Vendor");
    const vendorContract = await vendorContractFactory.deploy("0x5FbDB2315678afecb367f032d93F642f64180aa3");
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

//problem -