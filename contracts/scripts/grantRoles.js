const hre = require("hardhat");

/**
 * Script to grant roles to addresses (e.g., multisig for MINTER_ROLE)
 * Usage: npx hardhat run scripts/grantRoles.js --network mumbai
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS environment variable is required");
  }

  const GRXToken = await hre.ethers.getContractFactory("GRXToken");
  const grxToken = GRXToken.attach(contractAddress);

  console.log("Connected to GRXToken at:", contractAddress);
  console.log("Deployer:", deployer.address);

  // Get role hashes
  const MINTER_ROLE = await grxToken.MINTER_ROLE();
  const BURNER_ROLE = await grxToken.BURNER_ROLE();
  const ADMIN_ROLE = await grxToken.ADMIN_ROLE();

  // Example: Grant MINTER_ROLE to a multisig address
  const multisigAddress = process.env.MULTISIG_ADDRESS;
  if (multisigAddress) {
    console.log("\nGranting MINTER_ROLE to multisig:", multisigAddress);
    const tx = await grxToken.grantRole(MINTER_ROLE, multisigAddress);
    await tx.wait();
    console.log("✓ MINTER_ROLE granted");

    // Verify
    const hasRole = await grxToken.hasRole(MINTER_ROLE, multisigAddress);
    console.log("Role granted:", hasRole);
  }

  // Example: Grant BURNER_ROLE to an admin address
  const burnerAddress = process.env.BURNER_ADDRESS;
  if (burnerAddress) {
    console.log("\nGranting BURNER_ROLE to:", burnerAddress);
    const tx = await grxToken.grantRole(BURNER_ROLE, burnerAddress);
    await tx.wait();
    console.log("✓ BURNER_ROLE granted");
  }

  console.log("\n=== Role Management Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


