from Crypto.Hash import keccak


def keccak256(*args: tuple[str]) -> str:
    k = keccak.new(digest_bits=256)
    for arg in args:
        k.update(arg.encode())
    d = k.hexdigest()
    return '0x' + d


def sub_keccak256(arg: str) -> str:
    value = int(keccak256(arg), 16) - 1
    return hex(value)


#
# EIP-712 types
#


_EIP712_DOMAIN_TYPE = (
    "EIP712Domain("
        "string name,"
        "string version,"
        "uint256 chainId,"
        "address verifyingContract"
    ")"
)

_TOKEN_CHECK_TYPE = (
    "TokenCheck("
        "address token,"
        "uint256 minAmount,"
        "uint256 maxAmount"
    ")"
)

_TOKEN_USE_TYPE = (
    "TokenUse("
        "address protocol,"
        "uint256 chain,"
        "address account,"
        "uint256[] inIndices,"
        "TokenCheck[] outs,"
        "bytes args"
    ")"
)

_SWAP_STEP_TYPE = (
    "SwapStep("
        "uint256 chain,"
        "address swapper,"
        "address account,"
        "bool useDelegate,"
        "uint256 nonce,"
        "uint256 deadline,"
        "TokenCheck[] ins,"
        "TokenCheck[] outs,"
        "TokenUse[] uses"
    ")"
)

_SWAP_TYPE = (
    "Swap("
        "SwapStep[] steps"
    ")"
)

_STEALTH_SWAP_TYPE = (
    "StealthSwap("
        "uint256 chain,"
        "address swapper,"
        "address account,"
        "bytes32[] stepHashes"
    ")"
)


#
# EIP-712 type hashes
#


_EIP712_DOMAIN_TYPE_HASH = keccak256(
    _EIP712_DOMAIN_TYPE,
)

_TOKEN_CHECK_TYPE_HASH = keccak256(
    _TOKEN_CHECK_TYPE,
)

_TOKEN_USE_TYPE_HASH = keccak256(
    _TOKEN_USE_TYPE,
    _TOKEN_CHECK_TYPE,
)

_SWAP_STEP_TYPE_HASH = keccak256(
    _SWAP_STEP_TYPE,
    _TOKEN_CHECK_TYPE,
    _TOKEN_USE_TYPE,
)

_SWAP_TYPE_HASH = keccak256(
    _SWAP_TYPE,
    _SWAP_STEP_TYPE,
    _TOKEN_CHECK_TYPE,
    _TOKEN_USE_TYPE,
)

_STEALTH_SWAP_TYPE_HASH = keccak256(
    _STEALTH_SWAP_TYPE,
)


#
# Slot hashes
#


_NONCE_TYPE_TEST_NONCES_SLOT_HASH = sub_keccak256("xSwap.v2.NonceTypeTest._noncesHashSlot")

_SIMPLE_INITIALIZABLE_INITIALIZER_SLOT_HASH = sub_keccak256("xSwap.v2.SimpleInitializable._initializer")

_SWAPPER_SWAP_SIGNATURE_VALIDATOR_SLOT_HASH = sub_keccak256("xSwap.v2.Swapper._swapSignatureValidator")

_SWAPPER_PERMIT_RESOLVER_WHITELIST_SLOT_HASH = sub_keccak256("xSwap.v2.Swapper._permitResolverWhitelist")

_SWAPPER_USE_PROTOCOL_WHITELIST_SLOT_HASH = sub_keccak256("xSwap.v2.Swapper._useProtocolWhitelist")

_SWAPPER_DELEGATE_MANAGER_SLOT_HASH = sub_keccak256("xSwap.v2.Swapper._delegateManager")

_SWAPPER_NONCES_SLOT_HASH = sub_keccak256("xSwap.v2.Swapper._nonces")

_XSWAP_INITIALIZER_SLOT = sub_keccak256("xSwap.v2.XSwap._initializer")

_XSWAP_WITHDRAW_WHITELIST_SLOT = sub_keccak256("xSwap.v2.XSwap._withdrawWhitelist")

_XSWAP_LIFE_CONTROL_SLOT = sub_keccak256("xSwap.v2.XSwap._lifeControl")

_CBRIDGE_WITHDRAW_WHITELIST_SLOT = sub_keccak256("xSwap.v2.CBridge._withdrawWhitelist")

_HYPHEN_WITHDRAW_WHITELIST_SLOT = sub_keccak256("xSwap.v2.Hyphen._withdrawWhitelist")

_GENERIC_CALL_WITHDRAW_WHITELIST_SLOT = sub_keccak256("xSwap.v2.GenericCall._withdrawWhitelist")

_OWNABLE_ACCOUNT_WHITELIST_FACTORY_INITIALIZER_SLOT = sub_keccak256("xSwap.v2.OwnableAccountWhitelistFactory._initializer")


def show_header(title: str) -> None:
    dashs = '-' * len(title)
    print(f'+-{dashs}-+')
    print(f'| {title} |')
    print(f'+-{dashs}-+')
    print()


def show_type_hash(type: str, hash: str) -> None:
    print(f'Type: {type}')
    print(f'Hash: {hash}')
    print()


def show_type_hashes() -> None:
    show_header('Struct Hashes (keccak256)')
    show_type_hash('EIP712_DOMAIN_TYPE', _EIP712_DOMAIN_TYPE_HASH)
    show_type_hash('TOKEN_CHECK_TYPE_HASH', _TOKEN_CHECK_TYPE_HASH)
    show_type_hash('TOKEN_USE_TYPE_HASH', _TOKEN_USE_TYPE_HASH)
    show_type_hash('SWAP_STEP_TYPE_HASH', _SWAP_STEP_TYPE_HASH)
    show_type_hash('SWAP_TYPE_HASH', _SWAP_TYPE_HASH)
    show_type_hash('STEALTH_SWAP_TYPE_HASH', _STEALTH_SWAP_TYPE_HASH)


def show_slot_hashes() -> None:
    show_header('Slot Hashes (keccak256 - 1)')
    show_type_hash('NONCE_TYPE_TEST_NONCES_SLOT_HASH', _NONCE_TYPE_TEST_NONCES_SLOT_HASH)
    show_type_hash('SIMPLE_INITIALIZABLE_INITIALIZER_SLOT_HASH', _SIMPLE_INITIALIZABLE_INITIALIZER_SLOT_HASH)
    show_type_hash('SWAPPER_SWAP_SIGNATURE_VALIDATOR_SLOT_HASH', _SWAPPER_SWAP_SIGNATURE_VALIDATOR_SLOT_HASH)
    show_type_hash('SWAPPER_PERMIT_RESOLVER_WHITELIST_SLOT_HASH', _SWAPPER_PERMIT_RESOLVER_WHITELIST_SLOT_HASH)
    show_type_hash('SWAPPER_USE_PROTOCOL_WHITELIST_SLOT_HASH', _SWAPPER_USE_PROTOCOL_WHITELIST_SLOT_HASH)
    show_type_hash('SWAPPER_DELEGATE_MANAGER_SLOT_HASH', _SWAPPER_DELEGATE_MANAGER_SLOT_HASH)
    show_type_hash('SWAPPER_NONCES_SLOT_HASH', _SWAPPER_NONCES_SLOT_HASH)
    show_type_hash('XSWAP_INITIALIZER_SLOT', _XSWAP_INITIALIZER_SLOT)
    show_type_hash('XSWAP_WITHDRAW_WHITELIST_SLOT', _XSWAP_WITHDRAW_WHITELIST_SLOT)
    show_type_hash('XSWAP_LIFE_CONTROL_SLOT', _XSWAP_LIFE_CONTROL_SLOT)
    show_type_hash('CBRIDGE_WITHDRAW_WHITELIST_SLOT', _CBRIDGE_WITHDRAW_WHITELIST_SLOT)
    show_type_hash('HYPHEN_WITHDRAW_WHITELIST_SLOT', _HYPHEN_WITHDRAW_WHITELIST_SLOT)
    show_type_hash('GENERIC_CALL_WITHDRAW_WHITELIST_SLOT', _GENERIC_CALL_WITHDRAW_WHITELIST_SLOT)
    show_type_hash('OWNABLE_ACCOUNT_WHITELIST_FACTORY_INITIALIZER_SLOT', _OWNABLE_ACCOUNT_WHITELIST_FACTORY_INITIALIZER_SLOT)


def main() -> None:
    show_type_hashes()
    show_slot_hashes()


if __name__ == '__main__':
    main()
