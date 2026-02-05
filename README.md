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
