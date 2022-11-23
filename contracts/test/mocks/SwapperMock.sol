// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {ISwapper, SwapParams, StealthSwapParams} from "../../core/swap/ISwapper.sol";

contract SwapperMock is ISwapper {
    function swap(SwapParams calldata params_) public payable {} // solhint-disable-line no-empty-blocks

    function swapStealth(StealthSwapParams calldata params_) external payable {} // solhint-disable-line no-empty-blocks
}
