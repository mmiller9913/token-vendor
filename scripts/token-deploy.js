//run with npx hardhat run scripts/token-deploy.js --network rinkeby

const main = async () => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Deploying contract with account: ", owner.address);
    const tokenContractFactory = await hre.ethers.getContractFactory("MyToken");
    const tokenContract = await tokenContractFactory.deploy();
    await tokenContract.deployed();
    console.log("Contract deployed to:", tokenContract.address);   
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