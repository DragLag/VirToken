
# Vira Token (VIR)

**Vira** is a custom ERC20 token representing a *demurrage* or *ice currency* — a form of money that expires after a certain duration. This contract implements time-limited token balances to encourage timely use and discourage hoarding.

## Features

- 🧊 **Expiring Tokens**: Each user’s tokens are valid only for a defined duration.
- 🔐 **Authorized Minting**: Only a designated address can generate tokens for users.
- 🔥 **Burning Expired Tokens**: Users can manually burn their own expired tokens.
- 🚫 **Transfer Restrictions**: Expired tokens cannot be transferred.

## Smart Contract Summary

### `generateTokensForUser(address user, uint256 duration)`
- Mints up to a maximum of 100 VIR to the user.
- Resets the expiration time for that user.
- Callable **only by the authorized address** (e.g. a community operator or dApp).

### `burnExpiredTokens()`
- Allows users to burn their **own expired tokens**.
- Ensures expired balances don't stay in circulation.

### `transfer(address to, uint256 amount)`
- Overrides the standard ERC20 `transfer`.
- Prevents sending tokens if they have expired.

### `setAuthorizedAddress(address newAddress)`
- Allows the contract owner to update who can mint tokens.

## Usage Example

```solidity
// Mint expiring tokens (e.g., valid for 7 days)
await vira.generateTokensForUser(userAddress, 7 * 24 * 60 * 60);

// Check if a user can transfer
await vira.transfer(recipient, amount); // Fails if expired

// Burn tokens if expired
await vira.burnExpiredTokens();
```

## Constants

- `MAX_GENERATABLE = 100`: A user can hold a maximum of 100 VIR via `generateTokensForUser`.
- `authorizedAddress`: Only this address can mint.

## Deployment

This contract is compatible with Truffle or Hardhat:

```js
const Vira = artifacts.require("Vira");

module.exports = async function (deployer) {
  await deployer.deploy(Vira);
};
```

## Notes

- Token expiration is **per user**, not per token.
- Users are responsible for calling `burnExpiredTokens()` when needed.
- Transfers are automatically blocked once tokens have expired.

## License

MIT
