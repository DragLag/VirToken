const Vira = artifacts.require("Vira");

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(Vira);
    const tokenInstance = await Vira.deployed();

    await tokenInstance.setAuthorizedAddress(accounts[1], { from: accounts[0] });

    console.log("Indirizzo admin:", accounts[0]);
    console.log("Indirizzo autorizzato:", accounts[1]);
};
