// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {IERC20} from "../../lib/IERC20.sol";

interface ITokenMock is IERC20 {
    function mint(address account, uint256 amount) external;
}
