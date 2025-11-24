const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // For production, the minter should be a multisig address (Gnosis Safe)
  // For testing, we'll use the deployer address
  const defaultAdmin = process.env.DEFAULT_ADMIN || deployer.address;
  const minter = process.env.MINTER_ADDRESS || deployer.address;

  console.log("Default Admin:", defaultAdmin);
  console.log("Minter Address:", minter);

  // Deploy GRXToken
  const GRXToken = await hre.ethers.getContractFactory("GRXToken");
  const grxToken = await GRXToken.deploy(defaultAdmin, minter);

  await grxToken.waitForDeployment();
  const grxTokenAddress = await grxToken.getAddress();

  console.log("GRXToken deployed to:", grxTokenAddress);

  // Verify roles are set correctly
  const hasMinterRole = await grxToken.hasRole(
    await grxToken.MINTER_ROLE(),
    minter
  );
  console.log("Minter role granted:", hasMinterRole);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    contractAddress: grxTokenAddress,
    deployer: deployer.address,
    defaultAdmin: defaultAdmin,
    minter: minter,
    timestamp: new Date().toISOString(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // If on a live network, wait for block confirmations before verification
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await grxToken.deploymentTransaction().wait(5);

    // Verify contract on Polygonscan
    if (process.env.POLYGONSCAN_API_KEY) {
      try {
        await hre.run("verify:verify", {
          address: grxTokenAddress,
          constructorArguments: [defaultAdmin, minter],
        });
        console.log("Contract verified on Polygonscan!");
      } catch (error) {
        console.log("Verification failed:", error.message);
      }
    }
  }

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


