const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const tokenUris = [
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
]

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("randomIpfsNft", () => {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock, enterFee

          beforeEach(async () => {
              await deployments.fixture(["mocks", "randomipfs"])
              deployer = (await getNamedAccounts()).deployer
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              subscriptionId = await randomIpfsNft.getSubscriptionId()
              enterFee = await randomIpfsNft.getMintFee()
              await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address) // the contract needs to be added as consumer for the VRF mock
          })

          describe("constructor", () => {
              it("It initiates the contract correctly", async () => {
                  const name = await randomIpfsNft.name()
                  const symbol = await randomIpfsNft.symbol()
                  const tokenUris = await randomIpfsNft.getTokenUris(0)

                  assert.equal(name, "Random IPFS NFT")
                  assert.equal(symbol, "RIN")
                  assert.equal(tokenUris.toString().includes("ipfs://"), true)
              })
          })

          describe("requestNft", () => {
              it("Fails if mintFee not met", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfNft__NeedMoreETHSent"
                  )
              })

              //   it("Records user when request nft", async () => {
              //       const enterFee = ethers.utils.parseEther("0.02")
              //       const requestId = await randomIpfsNft.requestNft({ value: enterFee })
              //       // console.log(await randomIpfsNft.s_requestIdToSender(0))
              //       const user = await randomIpfsNft.s_requestIdToSender([requestId])
              //       assert.equal(user, deployer)
              //   })

              it("Emits event when nft minted", async () => {
                  await expect(randomIpfsNft.requestNft({ value: enterFee })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", () => {
              it("Completes the mint process", async () => {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              console.log("Event found!!")
                              const tokenCounter = await randomIpfsNft.s_tokenCounter()

                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      const txResponse = await randomIpfsNft.requestNft({ value: enterFee })
                      const txReceipt = await txResponse.wait(1)

                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId, // if it's only one arg, txReceipt.events[1].args
                          randomIpfsNft.address
                      )
                  })
              })
          })

          describe("getBreedFromModdedRng", () => {
              it("Assigns the breed correctly", async () => {
                  pug = await randomIpfsNft.getBreedFromModdedRng(5)
                  shibaInu = await randomIpfsNft.getBreedFromModdedRng(20)
                  stBernard = await randomIpfsNft.getBreedFromModdedRng(50)

                  assert.equal(pug, "0")
                  assert.equal(shibaInu, "1")
                  assert.equal(stBernard, "2")
              })
          })
      })
/**
 * constructor initiates correctly
 * if value < mintFee, it fails
 * random numbers are fulfilled
 * breed is calculated correctly
 * owner can withdraw
 * */
