const { assert } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT Unit test", () => {
          let basicNft, deployer
          const TOKEN_URI =
              "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"

          beforeEach(async () => {
              await deployments.fixture(["all"])
              deployer = (await getNamedAccounts()).deployer
              basicNft = await ethers.getContract("BasicNft", deployer)
          })

          describe("constructor", () => {
              it("Initializes the contract correctly", async () => {
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  const counter = await basicNft.getTokenCounter()
                  assert.equal(name, "Dogie")
                  assert.equal(symbol, "DOG")
                  assert.equal(counter.toString(), "0")
              })
          })

          describe("mintNft", () => {
              let token

              beforeEach(async () => {
                  await basicNft.mintNft()
                  token = await basicNft.getTokenCounter()
              })

              it("Increases Counter after minting", async () => {
                  assert.equal(token.toString(), "1")
              })

              it("Reads the correct tokenURI", async () => {
                  tokenURI = await basicNft.tokenURI(0)
                  assert.equal(tokenURI, TOKEN_URI)
              })

              it("Show the correct owner of an NFT", async () => {
                  owner = await basicNft.ownerOf(1)
                  deployerBalance = await basicNft.balanceOf(deployer)

                  assert.equal(owner, deployer)
                  assert.equal(deployerBalance.toString(), "1")
              })
          })
      })
