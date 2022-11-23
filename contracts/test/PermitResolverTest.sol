// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {IPermitResolver} from "../core/permit/IPermitResolver.sol";

contract PermitResolverTest {
    function resolvePermit(
        address resolver_,
        address token_,
        address from_,
        uint256 amount_,
        uint256 deadline_,
        bytes calldata signature_
    ) public {
        IPermitResolver(resolver_).resolvePermit(token_, from_, amount_, deadline_, signature_);
    }
}
