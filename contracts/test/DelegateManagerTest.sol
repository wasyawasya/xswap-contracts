// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {Delegate} from "../core/delegate/Delegate.sol";
import {DelegateManager, DelegateManagerConstructorParams} from "../core/delegate/DelegateManager.sol";

import {OwnableAccountWhitelist} from "../core/whitelist/OwnableAccountWhitelist.sol";
import {IAccountWhitelist} from "../core/whitelist/IAccountWhitelist.sol";

contract DelegateManagerTest {
    address private immutable _delegatePrototype;
    address private immutable _withdrawWhitelist;
    address private immutable _delegateManager;

    constructor() {
        _delegatePrototype = address(new Delegate());
        _withdrawWhitelist = address(new OwnableAccountWhitelist());
        _delegateManager = address(
            new DelegateManager(
                DelegateManagerConstructorParams({
                    delegatePrototype: _delegatePrototype,
                    withdrawWhitelist: _withdrawWhitelist
                })
            )
        );
    }

    function delegatePrototype() public view returns (address) {
        return _delegatePrototype;
    }

    function withdrawWhitelist() public view returns (address) {
        return _withdrawWhitelist;
    }

    function addToWithdrawWhitelist(address account_) public {
        IAccountWhitelist(_withdrawWhitelist).addAccountToWhitelist(account_);
    }

    function delegateManager() public view returns (address) {
        return _delegateManager;
    }
}
