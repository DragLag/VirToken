const Vira = artifacts.require("Vira");

contract("Vira", (accounts) => {
    const [owner, user1, user2] = accounts;
    let token;
    const duration = 3600; // 1 ora

    beforeEach(async () => {
        token = await Vira.new();
    });

    it("should assert true", async function () {
        await Vira.deployed();
        return assert.isTrue(true);
      });

    it("should mint tokens up to 100 if balance is below 100", async () => {
        await token.requestTokens(duration, { from: user1 });

        const balance = await token.balanceOf(user1);
        assert.strictEqual(balance.toNumber(), 100, "Balance should be 100");

        const expiration = await token.expirationTimes(user1);
        assert(expiration.toNumber() > 0, "Expiration time should be set");
    });

    it("should not allow minting if balance is already 100 or more", async () => {
        await token.requestTokens(duration, { from: user1 });

        try {
            await token.requestTokens(duration, { from: user1 });
            assert.fail("Expected error not thrown");
        } catch (error) {
            assert(error.message.includes("You already have enough tokens"), "Expected 'You already have enough tokens'");
        }
    });

    it("should allow transfers if tokens are not expired", async () => {
        await token.requestTokens(duration, { from: user1 });

        await token.transfer(user2, 50, { from: user1 });

        const balance1 = await token.balanceOf(user1);
        const balance2 = await token.balanceOf(user2);
        assert.strictEqual(balance1.toNumber(), 50, "User1 should have 50 tokens");
        assert.strictEqual(balance2.toNumber(), 50, "User2 should have 50 tokens");
    });

    it("should not allow transfers if tokens are expired", async () => {
        await token.requestTokens(1, { from: user1 });
        
        // Simuliamo il passare del tempo
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        try {
            await token.transfer(user2, 10, { from: user1 });
            assert.fail("Expected error not thrown");
        } catch (error) {
            assert(error.message.includes("Tokens expired"), "Expected 'Tokens expired'");
        }
    });

    it("should burn expired tokens", async () => {
        await token.requestTokens(1, { from: user1 });

        //await new Promise((resolve) => setTimeout(resolve, 2000));
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [2], // Aumentiamo di 2 secondi
            id: new Date().getTime()
        }, () => {});
    
        // Minare un nuovo blocco per applicare l'aggiornamento del timestamp
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            params: [],
            id: new Date().getTime()
        }, () => {});

        await token.burnExpiredTokens({ from: user1 });

        const balance = await token.balanceOf(user1);
        assert.strictEqual(balance.toNumber(), 0, "User1 balance should be 0 after burning");
    });
});
