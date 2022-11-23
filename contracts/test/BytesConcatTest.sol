// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

contract BytesConcatTest {
    bytes32 public lastDefaultConcatHash;
    bytes32 public lastPreAllocConcatHash;

    function concatHashesDefault(uint256 total_) public {
        lastDefaultConcatHash = _concatHashesDefault(total_);
    }

    function concatHashesPreAlloc(uint256 total_) public {
        lastPreAllocConcatHash = _concatHashesPreAlloc(total_);
    }

    function _concatHashesDefault(uint256 total_) public pure returns (bytes32 totalHash) {
        bytes memory bytesToHash = new bytes(0);
        for (uint256 i = 0; i < total_; i++) {
            bytesToHash = bytes.concat(bytesToHash, _dataSource(i));
        }
        totalHash = keccak256(bytesToHash);
    }

    function _concatHashesPreAlloc(uint256 total_) public pure returns (bytes32 totalHash) {
        bytes memory bytesToHash = new bytes(total_ << 5); // * 0x20
        uint256 offset;
        assembly {
            offset := add(bytesToHash, 0x20)
        }
        for (uint256 i = 0; i < total_; i++) {
            bytes32 data = _dataSource(i);
            assembly {
                mstore(offset, data)
                offset := add(offset, 0x20)
            }
        }
        totalHash = keccak256(bytesToHash);
    }

    function _dataSource(uint256 index_) private pure returns (bytes32 data) {
        data = keccak256(abi.encode(index_));
    }
}
