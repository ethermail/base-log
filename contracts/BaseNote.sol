// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BaseNote
/// @author ethermail
/// @notice Minimal on-chain note contract for Base builders.
/// @dev
/// - Stores only the latest note
/// - Optimized for simplicity and auditability
/// - No access control, no history, no upgrade logic
/// @custom:security-contact security@ethermail.xyz
/// @custom:invariant
/// - The stored note length is always <= MAX_NOTE_LENGTH
/// - The contract stores at most one note at any time
/// - Updating the note always emits a NoteUpdated event
/// @custom:assumptions
/// - The EVM executes according to the chain's protocol (no consensus/client faults).
/// - Anyone can call setNote; off-chain systems must not assume an authorized updater.
/// - Note length is measured in bytes (bytes(note).length), not human-visible characters.
/// - Off-chain consumers are responsible for indexing/reading NoteUpdated events.
/// @custom:threat-model
/// - Front-running is possible: anyone may update the note before another transaction is mined.
/// - Griefing is possible: arbitrary users can overwrite the stored note.
/// - Event spoofing is not prevented: off-chain consumers must trust on-chain events only.
/// - Denial-of-service via storage bloat is mitigated by MAX_NOTE_LENGTH.
/// @custom:limitations
/// - No access control: any address can overwrite the stored note.
/// - No historical data: only the latest note is stored on-chain.
/// - No input sanitization beyond length checks (content is arbitrary bytes).
/// - No upgrade mechanism: changes require redeployment.
contract BaseNote {
    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @dev Maximum allowed note length (in bytes).
    uint256 public constant MAX_NOTE_LENGTH = 280;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @dev Reverted when note length exceeds MAX_NOTE_LENGTH.
    /// @param length The provided note length in bytes.
    error NoteTooLong(uint256 length);

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Latest note stored on-chain.
    /// @dev Overwritten on every update.
    string public note;

    /*//////////////////////////////////////////////////////////////
                                  EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when the note is updated.
    /// @param by The address that updated the note.
    /// @param note The new note content.
    event NoteUpdated(address indexed by, string note);

    /*//////////////////////////////////////////////////////////////
                              WRITE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Deploys the contract.
    /// @dev Intentionally empty. This contract keeps no constructor-time state.
    constructor() {}

    /// @notice Update the stored note.
    /// @dev Reverts if note length exceeds MAX_NOTE_LENGTH.
    /// @param newNote The new note content.
    function setNote(string calldata newNote) external {
        uint256 len = bytes(newNote).length;
        if (len > MAX_NOTE_LENGTH) revert NoteTooLong(len);

        note = newNote;
        emit NoteUpdated(msg.sender, newNote);
    }

    /*//////////////////////////////////////////////////////////////
                               VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns the length of the current note.
    /// @return length The length of the note in bytes.
    function noteLength() external view returns (uint256 length) {
        length = bytes(note).length;
    }

    /// @notice Checks whether a note is currently set.
    /// @return True if note length > 0.
    function hasNote() external view returns (bool) {
        return bytes(note).length > 0;
    }
}
