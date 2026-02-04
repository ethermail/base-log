// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BaseNote {
    string public note;
    event NoteUpdated(address indexed by, string note);

    function setNote(string calldata n) external {
        note = n;
        emit NoteUpdated(msg.sender, n);
    }
}
