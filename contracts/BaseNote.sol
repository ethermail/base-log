// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal on-chain note contract for Base builders.
contract BaseNote {
    /// @dev Stores the latest note value only.
    /// @notice Latest note stored on-chain
    string public note;

    /// @notice Emitted when the note is updated.
    event NoteUpdated(address indexed by, string note);

    /// @notice Update the stored note and emit an event.
    function setNote(string calldata n) external {
        require(bytes(n).length <= 280, "note too long");
        note = n;
        emit NoteUpdated(msg.sender, n);
    }

    /// @notice Returns the length of the current note
    function noteLength() external view returns (uint256) {
        return bytes(note).length;
    }
}
