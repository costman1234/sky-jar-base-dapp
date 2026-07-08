// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SkyJar {
    uint256 public nextNoteId = 1;

    struct SkyNote {
        address observer;
        string sky;
        string feel;
        string mood;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => SkyNote) private notes;

    event SkySaved(
        uint256 indexed noteId,
        address indexed observer,
        string sky,
        string feel,
        string mood
    );

    function saveSky(
        string calldata sky,
        string calldata feel,
        string calldata mood,
        string calldata note
    ) external returns (uint256 noteId) {
        require(bytes(sky).length > 0 && bytes(sky).length <= 32, "Invalid sky");
        require(bytes(feel).length > 0 && bytes(feel).length <= 24, "Invalid feel");
        require(bytes(mood).length > 0 && bytes(mood).length <= 24, "Invalid mood");
        require(bytes(note).length > 0 && bytes(note).length <= 180, "Invalid note");

        noteId = nextNoteId++;
        notes[noteId] = SkyNote({
            observer: msg.sender,
            sky: sky,
            feel: feel,
            mood: mood,
            note: note,
            createdAt: block.timestamp
        });

        emit SkySaved(noteId, msg.sender, sky, feel, mood);
    }

    function getSky(
        uint256 noteId
    )
        external
        view
        returns (
            address observer,
            string memory sky,
            string memory feel,
            string memory mood,
            string memory note,
            uint256 createdAt
        )
    {
        SkyNote storage entry = notes[noteId];
        return (
            entry.observer,
            entry.sky,
            entry.feel,
            entry.mood,
            entry.note,
            entry.createdAt
        );
    }
}
