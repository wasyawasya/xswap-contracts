// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {ERC20} from "../../lib/ERC20.sol";
import {ERC20Permit} from "../../lib/draft-ERC20Permit.sol";

import {ITokenMock} from "./ITokenMock.sol";

contract PermitTokenMock is ERC20Permit, ITokenMock {
    // prettier-ignore
    constructor()
        ERC20("Test Token", "ttkn")
        ERC20Permit("Test Token Domain")
    {} // solhint-disable-line no-empty-blocks

    function mint(address account_, uint256 amount_) external {
        _mint(account_, amount_);
    }
}
