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
