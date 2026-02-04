# base-log
	Build on Base: ship fast, verify on-chain
	Principle: optimize for feedback loops, not perfection.
Invariants > features: keep state transitions boring.
	Every tx is a log entry; design for observability.
	  Prefer idempotent flows; retries should be safe.
 Wallet UX: assume users will refresh at the worst time
  Indexers lag; contracts don’t
 ABI is the contract; UI is a view
Gas is a tax on complexity; pay only for value
