// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal on-chain note contract for Base builders.
contract BaseNote {
    /// @notice Maximum allowed note length (bytes)
    uint256 public constant MAX_NOTE_LENGTH = 280;

    /// @notice Reverted when note exceeds MAX_NOTE_LENGTH
    error NoteTooLong();

    /// @notice Latest note stored on-chain
    string public note;

    /// @notice Emitted when the note is updated
    event NoteUpdated(address indexed by, string note);

    /// @notice Update the stored note and emit an event
    function setNote(string calldata n) external {
        if (bytes(n).length > MAX_NOTE_LENGTH) {
            revert NoteTooLong();
        }

        note = n;
        emit NoteUpdated(msg.sender, n);
    }

    /// @notice Returns the length of the current note (in bytes)
    function noteLength() external view returns (uint256) {
        return bytes(note).length;
    }

    /// @notice Checks whether a note is currently set
    function hasNote() external view returns (bool) {
        return bytes(note).length > 0;
    }

    /// @notice Returns true if no note is set
    function isEmpty() external view returns (bool) {
        return bytes(note).length == 0;
    }
}
