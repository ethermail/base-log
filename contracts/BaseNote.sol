// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BaseNote
/// @notice Minimal on-chain note contract for Base builders.
contract BaseNote {
    /// @notice Maximum allowed note length (in bytes).
    uint256 public constant MAX_NOTE_LENGTH = 280;

    /// @notice Latest note stored on-chain.
    string public note;

    /// @notice Emitted when the note is updated.
    /// @param author The account that updated the note.
    /// @param note The new note content.
    event NoteUpdated(address indexed author, string note);

    /// @notice Update the stored note and emit an event.
    /// @dev Reverts if the note exceeds MAX_NOTE_LENGTH bytes.
    /// @param n The new note content.
    function setNote(string calldata n) external {
        require(bytes(n).length <= MAX_NOTE_LENGTH, "note too long");
        note = n;
        emit NoteUpdated(msg.sender, n);
    }

    /// @notice Returns the length of the current note (in bytes).
    function noteLength() external view returns (uint256) {
        return bytes(note).length;
    }

    /// @notice Returns true if a non-empty note is set.
    function hasNote() external view returns (bool) {
        return bytes(note).length != 0;
    }
}
