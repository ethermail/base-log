# Base Note

A minimal on-chain note contract for Base builders.

This project demonstrates a simple Solidity smart contract that stores a single text note on-chain, emits events on updates, and provides lightweight helper view functions.

---

## ✨ Features

- Store a single note on-chain
- Enforce a maximum note length (280 characters)
- Emit events on updates
- Read helper functions:
  - Get note length
  - Check whether a note exists
  - Check whether the note is empty

---

## 📁 Project Structure

## Why BaseNote is Minimal

BaseNote is intentionally designed to be minimal.

### What it does

- Stores a single string value on-chain
- Emits an event on every update
- Exposes small, explicit view helpers

### What it does NOT do

- No access control or ownership
- No historical storage or pagination
- No upgrade or proxy logic

### Rationale

The goal is to keep the contract:

- Easy to audit
- Easy to reason about
- Cheap to deploy and interact with

This makes BaseNote suitable as a learning reference, a demo primitive,
or a building block for higher-level applications.

## Security Model

This project intentionally keeps the contract minimal. The security posture is documented both in the contract NatSpec and summarized here.

### Invariants

- The stored note length is always `<= MAX_NOTE_LENGTH`
- The contract stores at most one note at any time
- Updating the note always emits a `NoteUpdated` event

### Assumptions

- The EVM executes according to the chain protocol (no consensus/client faults)
- Anyone can call `setNote`; off-chain systems must not assume an authorized updater
- Note length is measured in bytes (`bytes(note).length`), not human-visible characters
- Off-chain consumers are responsible for indexing/reading `NoteUpdated` events

### Threat Model

- Front-running is possible: anyone may update the note before another transaction is mined
- Griefing is possible: arbitrary users can overwrite the stored note
- Off-chain consumers should trust on-chain data/events only

### Limitations

- No access control: any address can overwrite the stored note
- No historical data: only the latest note is stored on-chain
- No input sanitization beyond length checks (content is arbitrary bytes)
- No upgrade mechanism: changes require redeployment

### Supported Networks

- **Base Sepolia (84532)** — deployed and supported
- **Base Mainnet (8453)** — address placeholder, not deployed yet

The frontend automatically selects the correct contract address based on `chainId`.
