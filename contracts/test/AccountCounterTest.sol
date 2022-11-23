// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.16;

import {AccountCounter} from "../core/misc/AccountCounter.sol";

contract AccountCounterTest {
    using AccountCounter for AccountCounter.State;

    function testAccountCounter(
        address[] calldata accounts_,
        uint256 firstIndex_,
        uint256 secondIndex_
    ) external view returns (uint256 gasUsed) {
        require(accounts_.length >= 2, "AT: not enough accounts");

        gasUsed = gasleft();

        AccountCounter.State memory counter = AccountCounter.create(accounts_.length);

        require(counter.get(accounts_[firstIndex_]) == 0, "AT: bad value #00");
        require(counter.get(accounts_[secondIndex_]) == 0, "AT: bad value #01");

        counter.set(accounts_[firstIndex_], 0x42424242);

        require(counter.get(accounts_[firstIndex_]) == 0x42424242, "AT: bad value #10");
        require(counter.get(accounts_[secondIndex_]) == 0, "AT: bad value #11");

        counter.set(accounts_[secondIndex_], 0x336699);

        require(counter.get(accounts_[firstIndex_]) == 0x42424242, "AT: bad value #20");
        require(counter.get(accounts_[secondIndex_]) == 0x336699, "AT: bad value #21");

        require(counter.add(accounts_[firstIndex_], 0x10101010) == 0x52525252, "AT: bad value #30");

        require(counter.get(accounts_[firstIndex_]) == 0x52525252, "AT: bad value #40");
        require(counter.get(accounts_[secondIndex_]) == 0x336699, "AT: bad value #41");

        require(counter.add(accounts_[secondIndex_], 0x777777) == 0xaade10, "AT: bad value #50");

        require(counter.get(accounts_[firstIndex_]) == 0x52525252, "AT: bad value #60");
        require(counter.get(accounts_[secondIndex_]) == 0xaade10, "AT: bad value #61");

        counter.set(accounts_[secondIndex_], 0);

        require(counter.get(accounts_[firstIndex_]) == 0x52525252, "AT: bad value #70");
        require(counter.get(accounts_[secondIndex_]) == 0, "AT: bad value #71");

        counter.set(accounts_[firstIndex_], 0);

        require(counter.get(accounts_[firstIndex_]) == 0, "AT: bad value #80");
        require(counter.get(accounts_[secondIndex_]) == 0, "AT: bad value #81");

        gasUsed -= gasleft();
    }
}
