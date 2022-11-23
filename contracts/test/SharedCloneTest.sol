// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {Clones} from "../lib/Clones.sol";

contract Shared {
    mapping(address => uint256) private _counts;

    function getCount() public view returns (uint256) {
        return _counts[msg.sender];
    }

    function setCount(uint256 count_) public {
        _counts[msg.sender] = count_;
    }
}

contract Specific {
    address private immutable _shared;

    constructor(address shared_) {
        _shared = shared_;
    }

    function shared() public view returns (address) {
        return _shared;
    }

    function getCount() public view returns (uint256) {
        return Shared(_shared).getCount();
    }

    function setCount(uint256 count_) public {
        Shared(_shared).setCount(count_);
    }
}

contract SpecificCloner {
    address private immutable _specificTemplate;

    constructor(address specificTemplate_) {
        _specificTemplate = specificTemplate_;
    }

    function predict(bytes32 salt_) public view returns (address) {
        return Clones.predictDeterministicAddress(_specificTemplate, salt_);
    }

    function clone(bytes32 salt_) public returns (address) {
        return Clones.cloneDeterministic(_specificTemplate, salt_);
    }
}

contract SharedCloneTest {
    address private immutable _shared;
    address private immutable _factory;

    constructor() {
        _shared = address(new Shared());
        address specificTemplate = address(new Specific(_shared));
        _factory = address(new SpecificCloner(specificTemplate));
    }

    function shared() public view returns (address) {
        return _shared;
    }

    function factory() public view returns (address) {
        return _factory;
    }
}
