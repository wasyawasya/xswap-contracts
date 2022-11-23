// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {Delegate} from "../core/delegate/Delegate.sol";
import {DelegateDeployer} from "../core/delegate/DelegateDeployer.sol";

contract DelegateDeployerTest {
    address private immutable _delegatePrototype;
    address private immutable _delegateDeployer;

    constructor() {
        _delegatePrototype = address(new Delegate());
        _delegateDeployer = address(new DelegateDeployer(_delegatePrototype));
    }

    function delegatePrototype() public view returns (address) {
        return _delegatePrototype;
    }

    function delegateDeployer() public view returns (address) {
        return _delegateDeployer;
    }
}
