// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {StorageSlot} from "../lib/StorageSlot.sol";

contract NonceTypeTest {
    // bytes32 constant private _NONCES_SLOT = bytes32(uint256(keccak256("xSwap.v2.NonceTypeTest._noncesHashSlot")) - 1);
    bytes32 private constant _NONCES_SLOT = 0x7ea51bbc48d474ed9a0f173f1831f699562b5d553eaca7361d107841c9bf37f6;

    mapping(address => mapping(uint256 => bool)) private _noncesDoubleMap;
    mapping(bytes32 => bool) private _noncesSingleHashMap;

    function useDoubleMapNonces(uint256[] calldata nonces_) public {
        for (uint256 i = 0; i < nonces_.length; i++) {
            useDoubleMapNonce(nonces_[i]);
        }
    }

    function useDoubleMapNonce(uint256 nonce_) private {
        require(!_noncesDoubleMap[msg.sender][nonce_], "NT: nonce already used");
        _noncesDoubleMap[msg.sender][nonce_] = true;
    }

    function useSingleHashNonces(uint256[] calldata nonces_) public {
        for (uint256 i = 0; i < nonces_.length; i++) {
            useSingleHashNonce(nonces_[i]);
        }
    }

    function useSingleHashNonce(uint256 nonce_) private {
        bytes32 key = keccak256(abi.encodePacked(nonce_, msg.sender));
        require(!_noncesSingleHashMap[key], "NT: nonce already used");
        _noncesSingleHashMap[key] = true;
    }

    function useSlotHashNonces(uint256[] calldata nonces_) public {
        for (uint256 i = 0; i < nonces_.length; i++) {
            useSlotHashNonce(nonces_[i]);
        }
    }

    function useSlotHashNonce(uint256 nonce_) private {
        bytes32 slot = _NONCES_SLOT ^ keccak256(abi.encode(nonce_, msg.sender));
        StorageSlot.BooleanSlot storage nonceSlot = StorageSlot.getBooleanSlot(slot);
        require(!nonceSlot.value, "NT: nonce already used");
        nonceSlot.value = true;
    }
}
