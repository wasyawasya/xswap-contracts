// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {TokenHelper} from "../../core/asset/TokenHelper.sol";
import {NativeReceiver} from "../../core/asset/NativeReceiver.sol";
import {NativeReturnMods} from "../../core/asset/NativeReturnMods.sol";
import {NativeClaimer} from "../../core/asset/NativeClaimer.sol";

import {ITokenMock} from "./ITokenMock.sol";

struct CallMockIO {
    address token;
    uint256 amount;
}

struct CallMockLie {
    uint256 outputIndex;
    uint256 amount;
}

contract CallMock is NativeReceiver, NativeReturnMods {
    uint256 public constant AMOUNT = 1000 ether;

    function mint(address[] calldata tokens_) external payable {
        require(msg.value == AMOUNT, "CM: insufficient msg value");
        for (uint256 i = 0; i < tokens_.length; i++) {
            ITokenMock(tokens_[i]).mint(address(this), AMOUNT);
        }
    }

    function call(
        CallMockIO[] calldata inputs_,
        CallMockIO[] calldata outputs_,
        CallMockLie[] calldata lies_
    ) external payable returns (uint256[] memory outAmounts) {
        NativeClaimer.State memory nativeClaimer;
        return _call(inputs_, outputs_, lies_, nativeClaimer);
    }

    function _call(
        CallMockIO[] calldata inputs_,
        CallMockIO[] calldata outputs_,
        CallMockLie[] calldata lies_,
        NativeClaimer.State memory nativeClaimer_
    ) private returnUnclaimedNative(nativeClaimer_) returns (uint256[] memory outAmounts) {
        // Consume inputs
        for (uint256 i = 0; i < inputs_.length; i++) {
            TokenHelper.transferToThis(inputs_[i].token, msg.sender, inputs_[i].amount, nativeClaimer_);
        }

        // Produce outputs
        outAmounts = new uint256[](outputs_.length);
        for (uint256 i = 0; i < outputs_.length; i++) {
            TokenHelper.transferFromThis(outputs_[i].token, msg.sender, outputs_[i].amount);
            outAmounts[i] = outputs_[i].amount;
        }

        // Lie about output amounts
        for (uint256 i = 0; i < lies_.length; i++) {
            outAmounts[lies_[i].outputIndex] += lies_[i].amount;
        }
    }
}
