// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

uint256 public constant MAX_NOTE_LENGTH = 280;

error NoteTooLong();

/// @notice Minimal on-chain note contract for Base builders.
contract BaseNote {
    // ⬇️ ADD HERE (Commit 1)
    uint256 public constant MAX_NOTE_LENGTH = 280;
    // ⬆️ END

    // ⬇️ ADD HERE (Commit 2)
    error NoteTooLong();
    // ⬆️ END

    /// @notice Latest note stored on-chain
    string public note;

    /// @notice Emitted when the note is updated.
    event NoteUpdated(address indexed by, string note);

    /// @notice Update the stored note and emit an event.
    function setNote(string calldata n) external {
        // ⬇️ ADD HERE (Commit 3)
        if (bytes(n).length > MAX_NOTE_LENGTH) revert NoteTooLong();
        // ⬆️ END

        note = n;
        emit NoteUpdated(msg.sender, n);
    }

    // ⬇️ ADD HERE (Commit 5: view functions grouped)
    /// @notice Returns the length of the current note
    /// @return length The length of the note in bytes
    function noteLength() external view returns (uint256) {
        return bytes(note).length;
    }

    /// @notice Returns true if no note is set
    function isEmpty() external view returns (bool) {
        return bytes(note).length == 0;
    }
    // ⬆️ END
}
