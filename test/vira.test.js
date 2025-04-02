const Vira = artifacts.require("Vira");

contract("Vira", (accounts) => {
    let vira;
    const owner = accounts[0];
    const authorized = accounts[1];
    const user1 = accounts[2];
    const user2 = accounts[3];

    beforeEach(async () => {
        vira = await Vira.new();
        await vira.setAuthorizedAddress(authorized, { from: owner });
    });

    it("should assert true", async function () {
        await Vira.deployed();
        return assert.isTrue(true);
      });

    it("Only the authorized address can generate token", async () => {
        try {
            await vira.generateTokensForUser(user1, 3600, { from: user1 });
            assert.fail("Should fail");
        } catch (error) {
            assert(error.message.includes("You are not authorized"), "Wrong error message");
        }

        await vira.generateTokensForUser(user1, 3600, { from: authorized });
        const balance = await vira.balanceOf(user1);
        assert.equal(balance.toString(), "100", "The user should have 100 tokens");
    });

    it("The user cannot generate more than 100 tokens", async () => {
        await vira.generateTokensForUser(user1, 3600, { from: authorized });

        try {
            await vira.generateTokensForUser(user1, 3600, { from: authorized });
            assert.fail("Should fail");
        } catch (error) {
            assert(error.message.includes("enough tokens"), "Wrong error message");
        }
    });

    it("Only the owner can change the authorized address", async () => {
        try {
            await vira.setAuthorizedAddress(user2, { from: user1 });
            assert.fail("Should fail");
        } catch (error) {
            assert(error.message.includes("Ownable: caller is not the owner"), "Wrong error message");
        }

        await vira.setAuthorizedAddress(user2, { from: owner });
        const newAuthorized = await vira.authorizedAddress();
        assert.equal(newAuthorized, user2, "The authorized address has been changed");
    });

    it("Users can transfer tokens if not expired", async () => {
        await vira.generateTokensForUser(user1, 3600, { from: authorized });
    
        const balanceUser1Before = await vira.balanceOf(user1);
        console.log("Balance User 1 prima del trasferimento:", balanceUser1Before.toString());
    
        const expirationTime = await vira.expirationTimes(user1);
        const currentBlockTime = (await web3.eth.getBlock("latest")).timestamp;
        console.log("Expiration Time:", expirationTime.toString());
        console.log("Current Block Time:", currentBlockTime.toString());

        assert(currentBlockTime < expirationTime, "Tokens should not be expired yet");
  
        await vira.transfer(user2, 50, { from: user1 });
    
        const balanceUser2 = await vira.balanceOf(user2);
        console.log("Balance User 2 after transfer:", balanceUser2.toString());
        assert.equal(balanceUser2.toString(), "50", "User2 should have 50 tokens");
    });

    it("Tranfer fail after tokens expires", async () => {
        //3 seconds druation
        await vira.generateTokensForUser(user1, 3, { from: authorized });
        
        // simulate time passing
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [10], // time increse 10 seconds
            id: new Date().getTime()
        }, () => {});
    
        // new block to apply the time increase
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            params: [],
            id: new Date().getTime()
        }, () => {});
        const expirationTime = await vira.expirationTimes(user1);
        const currentBlockTime = (await web3.eth.getBlock("latest")).timestamp;
        console.log("Expiration Time:", expirationTime.toString());
        console.log("Current Block Time:", currentBlockTime.toString());
        try {
            await vira.transfer(user2, 10, { from: user1 });
            assert.fail("Should fail");
        } catch (error) {
            assert(error.message.includes("Tokens expired"), "Expected 'Tokens expired'");
        }
    });
    

    it("should allow transfers if tokens are not expired", async () => {
        await vira.generateTokensForUser(user1, 3600, { from: authorized });
        await vira.transfer(user2, 50, { from: user1 });
        const balance1 = await vira.balanceOf(user1);
        const balance2 = await vira.balanceOf(user2);
        assert.strictEqual(balance1.toNumber(), 50, "User1 should have 50 tokens");
        assert.strictEqual(balance2.toNumber(), 50, "User2 should have 50 tokens");
    });
    
   

    it("The expired token can be burned", async () => {
        await vira.generateTokensForUser(user1, 2, { from: authorized });

        // simulate time passing
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [10], // time increse 10 seconds
            id: new Date().getTime()
        }, () => {});
    
        // new block to apply the time increase
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            params: [],
            id: new Date().getTime()
        }, () => {});
        const expirationTime = await vira.expirationTimes(user1);
        const currentBlockTime = (await web3.eth.getBlock("latest")).timestamp;
        console.log("Expiration Time:", expirationTime.toString());
        console.log("Current Block Time:", currentBlockTime.toString());
     
        await vira.burnExpiredTokens({ from: user1 });
        const balance = await vira.balanceOf(user1);
        assert.equal(balance.toString(), "0", "The expired tokens should be burned");
    });

    it("should mint tokens up to 100 if balance is below 100", async () => {
        await vira.generateTokensForUser(user1, 3600, { from: authorized });

        const balance = await vira.balanceOf(user1);
        console.log("Balance User 1 after minting:", balance.toString());
        
        assert.strictEqual(balance.toNumber(), 100, "Balance should be 100");

        const expiration = await vira.expirationTimes(user1);
        console.log("Expiration Time:", expiration.toString());
        console.log("Current Block Time:", (await web3.eth.getBlock("latest")).timestamp.toString());
        assert(expiration.toNumber() > 0, "Expiration time should be set");
    });    

    it("should not allow minting if balance is already 100 or more", async () => {
        await vira.generateTokensForUser(user1, 3600, { from: authorized });
        try {
            await vira.generateTokensForUser(user1, 3600, { from: authorized });
            assert.fail("Should fail");
        } catch (error) {
            assert(error.message.includes("You already have enough tokens"), "Expected 'You already have enough tokens'");
        }
    });

});
