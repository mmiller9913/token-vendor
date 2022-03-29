//run with npx hardhat run scripts/vendor-deploy.js --network rinkeby 

const main = async () => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Deploying contract with account: ", owner.address);
    const vendorContractFactory = await hre.ethers.getContractFactory("Vendor");
    const vendorContract = await vendorContractFactory.deploy("0x88968a54b42de735508113aa398aE5a02210712a");
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

//before deploying
//change address in constuctor
//after deploying
//in remix, load the MyToken & Vendor contracts and transfer all tokens to the vendor