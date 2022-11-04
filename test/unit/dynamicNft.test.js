const { assert } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const fs = require("fs")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("dynamicNft", () => {
          let dynamicSvgNft, deployer, ethUsdAggregator, lowSVG, highSVG
          const lowSVGImageUri =
              "data:application/json;base64,eyJuYW1lIjoiRHluYW1pYyBTVkcgTkZUIiwgImRlc2NyaXB0aW9uIjoiQW4gTkZUIHRoYXQgY2hhbmdlcyB2YWx1ZXMgYmFzZWQgb24gQ2hhaW5saW5rIEZlZWQiLCAiYXR0cmlidXRlcyI6IFt7InRyYWl0X3R5cGUiOiAiY29vbG5lc3MiLCAidmFsdWUiOiAxMDB9XSwgImltYWdlIjoiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJ6ZEdGdVpHRnNiMjVsUFNKdWJ5SS9QZ284YzNabklIZHBaSFJvUFNJeE1ESTBjSGdpSUdobGFXZG9kRDBpTVRBeU5IQjRJaUIyYVdWM1FtOTRQU0l3SURBZ01UQXlOQ0F4TURJMElpQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaVBnb2dJRHh3WVhSb0lHWnBiR3c5SWlNek16TWlJR1E5SWswMU1USWdOalJETWpZMExqWWdOalFnTmpRZ01qWTBMallnTmpRZ05URXljekl3TUM0MklEUTBPQ0EwTkRnZ05EUTRJRFEwT0MweU1EQXVOaUEwTkRndE5EUTRVemMxT1M0MElEWTBJRFV4TWlBMk5IcHRNQ0E0TWpCakxUSXdOUzQwSURBdE16Y3lMVEUyTmk0MkxUTTNNaTB6TnpKek1UWTJMall0TXpjeUlETTNNaTB6TnpJZ016Y3lJREUyTmk0MklETTNNaUF6TnpJdE1UWTJMallnTXpjeUxUTTNNaUF6TnpKNklpOCtDaUFnUEhCaGRHZ2dabWxzYkQwaUkwVTJSVFpGTmlJZ1pEMGlUVFV4TWlBeE5EQmpMVEl3TlM0MElEQXRNemN5SURFMk5pNDJMVE0zTWlBek56SnpNVFkyTGpZZ016Y3lJRE0zTWlBek56SWdNemN5TFRFMk5pNDJJRE0zTWkwek56SXRNVFkyTGpZdE16Y3lMVE0zTWkwek56SjZUVEk0T0NBME1qRmhORGd1TURFZ05EZ3VNREVnTUNBd0lERWdPVFlnTUNBME9DNHdNU0EwT0M0d01TQXdJREFnTVMwNU5pQXdlbTB6TnpZZ01qY3lhQzAwT0M0eFl5MDBMaklnTUMwM0xqZ3RNeTR5TFRndU1TMDNMalJETmpBMElEWXpOaTR4SURVMk1pNDFJRFU1TnlBMU1USWdOVGszY3kwNU1pNHhJRE01TGpFdE9UVXVPQ0E0T0M0Mll5MHVNeUEwTGpJdE15NDVJRGN1TkMwNExqRWdOeTQwU0RNMk1HRTRJRGdnTUNBd0lERXRPQzA0TGpSak5DNDBMVGcwTGpNZ056UXVOUzB4TlRFdU5pQXhOakF0TVRVeExqWnpNVFUxTGpZZ05qY3VNeUF4TmpBZ01UVXhMalpoT0NBNElEQWdNQ0F4TFRnZ09DNDBlbTB5TkMweU1qUmhORGd1TURFZ05EZ3VNREVnTUNBd0lERWdNQzA1TmlBME9DNHdNU0EwT0M0d01TQXdJREFnTVNBd0lEazJlaUl2UGdvZ0lEeHdZWFJvSUdacGJHdzlJaU16TXpNaUlHUTlJazB5T0RnZ05ESXhZVFE0SURRNElEQWdNU0F3SURrMklEQWdORGdnTkRnZ01DQXhJREF0T1RZZ01IcHRNakkwSURFeE1tTXRPRFV1TlNBd0xURTFOUzQySURZM0xqTXRNVFl3SURFMU1TNDJZVGdnT0NBd0lEQWdNQ0E0SURndU5HZzBPQzR4WXpRdU1pQXdJRGN1T0MwekxqSWdPQzR4TFRjdU5DQXpMamN0TkRrdU5TQTBOUzR6TFRnNExqWWdPVFV1T0MwNE9DNDJjemt5SURNNUxqRWdPVFV1T0NBNE9DNDJZeTR6SURRdU1pQXpMamtnTnk0MElEZ3VNU0EzTGpSSU5qWTBZVGdnT0NBd0lEQWdNQ0E0TFRndU5FTTJOamN1TmlBMk1EQXVNeUExT1RjdU5TQTFNek1nTlRFeUlEVXpNM3B0TVRJNExURXhNbUUwT0NBME9DQXdJREVnTUNBNU5pQXdJRFE0SURRNElEQWdNU0F3TFRrMklEQjZJaTgrQ2p3dmMzWm5QZ289In0i"
          const highSVGImageUri =
              "data:application/json;base64,eyJuYW1lIjoiRHluYW1pYyBTVkcgTkZUIiwgImRlc2NyaXB0aW9uIjoiQW4gTkZUIHRoYXQgY2hhbmdlcyB2YWx1ZXMgYmFzZWQgb24gQ2hhaW5saW5rIEZlZWQiLCAiYXR0cmlidXRlcyI6IFt7InRyYWl0X3R5cGUiOiAiY29vbG5lc3MiLCAidmFsdWUiOiAxMDB9XSwgImltYWdlIjoiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCMmFXVjNRbTk0UFNJd0lEQWdNakF3SURJd01DSWdkMmxrZEdnOUlqUXdNQ0lnSUdobGFXZG9kRDBpTkRBd0lpQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaVBnb2dJRHhqYVhKamJHVWdZM2c5SWpFd01DSWdZM2s5SWpFd01DSWdabWxzYkQwaWVXVnNiRzkzSWlCeVBTSTNPQ0lnYzNSeWIydGxQU0ppYkdGamF5SWdjM1J5YjJ0bExYZHBaSFJvUFNJeklpOCtDaUFnUEdjZ1kyeGhjM005SW1WNVpYTWlQZ29nSUNBZ1BHTnBjbU5zWlNCamVEMGlOakVpSUdONVBTSTRNaUlnY2owaU1USWlMejRLSUNBZ0lEeGphWEpqYkdVZ1kzZzlJakV5TnlJZ1kzazlJamd5SWlCeVBTSXhNaUl2UGdvZ0lEd3ZaejRLSUNBOGNHRjBhQ0JrUFNKdE1UTTJMamd4SURFeE5pNDFNMk11TmprZ01qWXVNVGN0TmpRdU1URWdOREl0T0RFdU5USXRMamN6SWlCemRIbHNaVDBpWm1sc2JEcHViMjVsT3lCemRISnZhMlU2SUdKc1lXTnJPeUJ6ZEhKdmEyVXRkMmxrZEdnNklETTdJaTgrQ2p3dmMzWm5QZz09In0i"

          beforeEach(async () => {
              await deployments.fixture(["dynamic", "mocks"])
              dynamicSvgNft = await ethers.getContract("DynamicSvgNft")
              deployer = (await getNamedAccounts()).deployer
              ethUsdAggregator = await ethers.getContract("MockV3Aggregator")
              lowSVG = fs.readFileSync("./images/dynamicNFT/frown.svg", { encoding: "utf8" })
              highSVG = fs.readFileSync("./images/dynamicNFT/happy.svg", { encoding: "utf8" })
          })

          describe("constructor", () => {
              it("Initiates correctly", async () => {
                  lowImageURI = await dynamicSvgNft.svgToImageURI(lowSVG)
                  highImageURI = await dynamicSvgNft.svgToImageURI(highSVG)
                  contractLowImageURI = await dynamicSvgNft.getLowImageURI()
                  contractHighImageURI = await dynamicSvgNft.getHighImageURI()
                  nameERC721 = await dynamicSvgNft.name()
                  symbolERC721 = await dynamicSvgNft.symbol()

                  assert.equal(lowImageURI, contractLowImageURI)
                  assert.equal(highImageURI, contractHighImageURI)
                  assert.equal("Dynamic SVG NFT", nameERC721)
                  assert.equal("DSN", symbolERC721)
              })
          })

          describe("svgToImageURI", () => {
              it('Returns something that starts with "data:image/svg+xml;base64,"', async () => {
                  imageUri = await dynamicSvgNft.svgToImageURI("test")
                  assert.equal(imageUri.startsWith("data:image/svg+xml;base64,"), true)
              })
          })

          describe("mintNFT", () => {
              it("Completes NFT process", async () => {
                  await new Promise(async (resolve, reject) => {
                      dynamicSvgNft.once("CreatedNFT", async () => {
                          console.log("Event found!")
                          try {
                              tokenCounter = await dynamicSvgNft.getTokenCounter()
                              assert.equal(tokenCounter, "1")

                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          await dynamicSvgNft.mintNft(1)
                      } catch (e) {
                          console.log(e)
                      }
                  })
              })
          })

          describe("tokenURI", () => {
              it("Returns SVG for high value", async () => {
                  try {
                      const value = ethers.utils.parseEther("1")
                      txResponse = await dynamicSvgNft.mintNft(value)
                      await txResponse.wait(1)
                      const tokenURI = await dynamicSvgNft.tokenURI(1)
                      assert.equal(tokenURI.startsWith(highSVGImageUri), true)
                  } catch (e) {
                      console.log(e)
                  }
              })

              it("Returns SVG for low value", async () => {
                  try {
                      const value = ethers.utils.parseEther("1000000000000")
                      txResponse = await dynamicSvgNft.mintNft(value)
                      await txResponse.wait(1)
                      const tokenURI = await dynamicSvgNft.tokenURI(1)
                      assert.equal(tokenURI.startsWith(lowSVGImageUri), true)
                  } catch (e) {
                      console.log(e)
                  }
              })
          })
      })

/** Tests
 * constructor initiates correctly
 * svgToImageURI returns something that starts with "data:image/svg+xml;base64,"
 * mintNFT emits the event
 * tokenURI??
 * Aggregator??
 */
