// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IBaseNote
/// @notice Interface for the BaseNote contract.
interface IBaseNote {
    /// @notice Latest note stored on-chain.
    function note() external view returns (string memory);

    /// @notice Update the stored note.
    /// @param newNote The new note content.
    function setNote(string calldata newNote) external;

    /// @notice Returns the length of the current note.
    function noteLength() external view returns (uint256);

    /// @notice Checks whether a note is currently set.
    function hasNote() external view returns (bool);
}
