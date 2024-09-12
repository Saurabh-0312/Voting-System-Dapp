const { ethers } = require("hardhat");

async function main() {
  const Voting = await ethers.getContractFactory("Voting");

  const Voting_ = await Voting.deploy(["Mark", "Mike", "Henry", "Rock"], 10);

  console.log("Contract address", Voting_.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
