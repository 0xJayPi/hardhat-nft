const { EtherscanProvider } = require("@ethersproject/providers")
const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()

    // Basic NFT
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(`Basic NFT Index has tokenURI: ${await basicNft.tokenURI(0)}`)

    //Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    const randomIpfsNftTx = await randomIpfsNft.requestNft({ value: mintFee })
    const randomIpfsNftTxReceipt = await randomIpfsNftTx.wait(1)

    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 300000) // 5 minutes
        randomIpfsNft.once("NftMinted", async () => {
            resolve()
        })
        if (developmentChains.includes(network.name)) {
            const requestId = randomIpfsNftTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        }
    })

    console.log(`Random IPFS NFT index tokenUri: ${await randomIpfsNft.tokenURI(0)}`)

    // Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("2000")
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft")
    const dynamicSvgNftTx = await dynamicSvgNft.mintNft(highValue.toString())
    await dynamicSvgNftTx.wait(1)
    console.log(`Dynamic SVG NFT index tokeURI: ${await dynamicSvgNft.tokenURI(0)}`)
}

module.exports.tags = ["all", "mint"]
