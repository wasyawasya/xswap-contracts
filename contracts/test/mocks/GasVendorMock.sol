// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {IGasVendor, GasFee} from "../../protocols/gas/IGasVendor.sol";

contract GasVendorMock is IGasVendor {
    bool private _gasFeeSet;
    GasFee private _gasFee;

    function setGasFee(GasFee memory gasFee_) external {
        _gasFee = gasFee_;
        _gasFeeSet = true;
    }

    function getGasFee(address msgSender_, bytes calldata msgData_) external view returns (GasFee memory) {
        require(msgSender_ != address(0), "GM: zero msg sender");
        require(msgData_.length != 0, "GM: empty msg data");
        require(_gasFeeSet, "GM: gas fee mock not set");

        return _gasFee;
    }
}
