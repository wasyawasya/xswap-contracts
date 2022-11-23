import asyncio
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator
from typing import TypedDict
from uuid import uuid4

import aiohttp
from web3.auto import w3


erc20_abi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
]

weth_abi = [
    {"constant":True,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":False,"stateMutability":"view","type":"function"},{"constant":False,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":False,"stateMutability":"nonpayable","type":"function"},{"constant":True,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":False,"stateMutability":"view","type":"function"},{"constant":False,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":False,"stateMutability":"nonpayable","type":"function"},{"constant":False,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":False,"stateMutability":"nonpayable","type":"function"},{"constant":True,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":False,"stateMutability":"view","type":"function"},{"constant":True,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":False,"stateMutability":"view","type":"function"},{"constant":True,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":False,"stateMutability":"view","type":"function"},{"constant":False,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":False,"stateMutability":"nonpayable","type":"function"},{"constant":False,"inputs":[],"name":"deposit","outputs":[],"payable":True,"stateMutability":"payable","type":"function"},{"constant":True,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":False,"stateMutability":"view","type":"function"},{"payable":True,"stateMutability":"payable","type":"fallback"},{"anonymous":False,"inputs":[{"indexed":True,"name":"src","type":"address"},{"indexed":True,"name":"guy","type":"address"},{"indexed":False,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"name":"src","type":"address"},{"indexed":True,"name":"dst","type":"address"},{"indexed":False,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"name":"dst","type":"address"},{"indexed":False,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"name":"src","type":"address"},{"indexed":False,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}
]


def env(key: str) -> str:
    return os.environ[key]


def env_int(key: str) -> int:
    return int(env(key))


def env_bool(key: str) -> bool:
    bools = {
        'true': True,
        't': True,
        'false': False,
        'f': False,
    }
    return bools[env(key).lower()]


def env_bytes(key: str, n: int | None = None) -> bytes:
    hex_str = env(key).lower()
    if hex_str.startswith('0x'):
        hex_str = hex_str[2:]
    str_bytes = bytes.fromhex(hex_str)
    if n is not None:
        assert len(str_bytes) == n
    return str_bytes


TransactionCore = TypedDict('TransactionCore', {
    'from': str,
    'to': str,
})


class Transaction(TransactionCore, total=False):
    data: str
    value: int


def show_info(description: str, info: str | dict) -> None:
    print(f'{description}:')
    print('--- --- ---')
    print(info)
    print('--- --- ---')


def show_metamask_tx(tx: Transaction, description: str) -> None:
    tx_str = 'window.ethereum.request({ method: "eth_sendTransaction", params: [{ '
    tx_str += f'from: "{tx["from"]}", '
    tx_str += f'to: "{tx["to"]}", '
    if 'data' in tx:
        tx_str += f'data: "{tx["data"]}", '
    if 'value' in tx:
        tx_str += f'value: "{hex(tx["value"])}", '
    tx_str += '}] });'

    show_info(description, tx_str)


@asynccontextmanager
async def session_wrap() -> AsyncGenerator[aiohttp.ClientSession, None]:
    try:
        async with aiohttp.ClientSession() as session:
            yield session
    except aiohttp.ClientError as e:
        print(f'ClientError during HTTP call: {e}')
        raise


async def make_post_request(url: str, json: dict) -> dict:
    async with session_wrap() as s, s.post(url, json=json) as resp:
        resp.raise_for_status()
        json_resp = await resp.json()
        return json_resp


async def make_get_request(url: str) -> dict:
    async with session_wrap() as s, s.get(url) as resp:
        resp.raise_for_status()
        json_resp = await resp.json()
        return json_resp


async def main() -> None:
    # Params

    rpc_url = env('RPC_URL')
    relay_url = env('RELAY_URL')

    chain_id = env_int('CHAIN_ID')
    from_token = env('FROM_TOKEN')
    to_token = env('TO_TOKEN')
    fee_token = env('FEE_TOKEN')
    from_min_amount = env_int('FROM_MIN_AMOUNT')
    from_max_amount = env_int('FROM_MAX_AMOUNT')
    to_min_amount = env_int('TO_MIN_AMOUNT')
    wallet = env('WALLET')
    contract = env('CONTRACT')
    operation_id = env_bytes('OPERATION_ID', 32)
    relay_task_id = env('RELAY_TASK_ID')

    show_approve = env_bool('SHOW_APPROVE')
    approve_from_token = env_bool('APPROVE_FROM_TOKEN')  # True = 'from', False = 'to'
    form_proceed_data = env_bool('FORM_PROCEED_DATA')
    call_estimate_proceed = env_bool('CALL_ESTIMATE_PROCEED')
    show_estimate_proceed = env_bool('SHOW_ESTIMATE_PROCEED')
    call_gelato_relay = env_bool('CALL_GELATO_RELAY')
    show_gelato_relay = env_bool('SHOW_GELATO_RELAY')
    show_gelato_relay_task_state = env_bool('SHOW_GELATO_RELAY_TASK_STATE')
    show_deposit_withdraw = env_bool('SHOW_DEPOSIT_WITHDRAW')
    deposit_withdraw_from_token = env_bool('DEPOSIT_WITHDRAW_FROM_TOKEN')  # True = 'from', False = 'to'

    # Code

    project_root = (Path() / '..' / '..').resolve()
    assert project_root.name == 'xswap'

    xswap_path = project_root / 'artifacts' / 'contracts' / 'XSwap.sol' / 'XSwap.json'
    with open(xswap_path) as xswap_file:
        xswap_content = xswap_file.read()

    xswap_json = json.loads(xswap_content)
    xswap_abi = xswap_json['abi']

    xswap_contract = w3.eth.contract(abi=xswap_abi)
    if form_proceed_data:
        proceed_args = [
            from_token, # address _fromToken
            wallet, # address _fromAddress
            from_min_amount, # uint256 _fromMinAmount
            from_max_amount, # uint256 _fromMaxAmount
            to_token, # address _toToken
            wallet, # address _toAddress
            to_min_amount, # uint256 _toMinAmount,
            operation_id, # bytes32 _operationId,
            b'', # bytes calldata _signature
        ]
        proceed_call = xswap_contract.functions.proceed(*proceed_args)
        proceed_data = proceed_call._encode_transaction_data()
    else:
        proceed_data = None

    if show_approve:
        erc20_contract = w3.eth.contract(abi=erc20_abi)
        approve_args = [contract, 2 ** 256 - 1]  # spender, amount (infinite)
        approve_call = erc20_contract.functions.approve(*approve_args)
        approve_data = approve_call._encode_transaction_data()
        token_to_approve = from_token if approve_from_token else to_token
        approve_tx = {
            'from': wallet,
            'to': token_to_approve,
            'data': approve_data,
        }
        show_metamask_tx(approve_tx, 'Approve token for xSwap contract MetaMask call')

    proceed_tx = {
        'from': wallet,
        'to': contract,
        'data': proceed_data,
    }
    if show_estimate_proceed:
        show_metamask_tx(proceed_tx, 'xSwap proceed MetaMask call')
    if call_estimate_proceed:
        rpc_id = str(uuid4())
        rpc_json = {
            'id': rpc_id,
            'jsonrpc': '2.0',
            'method': 'eth_estimateGas',
            'params': [proceed_tx, 'latest'],
        }
        rpc_resp = await make_post_request(rpc_url, rpc_json)
        show_info('RPC call response', rpc_resp)

    gelato_relay_url = f'{relay_url}/metabox-relays/{chain_id}'
    gelato_relay_data = {
        'typeId': 'ForwardCall',
        'chainId': chain_id,
        'target': contract,
        'data': proceed_data,
        'feeToken': fee_token,
        'gas': '1000000',
    }
    if show_gelato_relay:
        show_info(f'Gelato relay data ({gelato_relay_url})', gelato_relay_data)
    if call_gelato_relay:
        relay_resp = await make_post_request(gelato_relay_url, gelato_relay_data)
        show_info('Relay call response', relay_resp)
    if show_gelato_relay_task_state:
        relay_task_url = f'{relay_url}/tasks/GelatoMetaBox/{relay_task_id}'
        task_resp = await make_get_request(relay_task_url)
        show_info(f'Relay task {relay_task_id} state', task_resp)

    if show_deposit_withdraw:
        weth_contract = w3.eth.contract(abi=weth_abi)
        amount = 10 ** (18 - 4)  # 0.0001 ETH
        # amount = 123  # 123 wei
        weth_token = from_token if deposit_withdraw_from_token else to_token

        deposit_call = weth_contract.functions.deposit()
        deposit_data = deposit_call._encode_transaction_data()
        deposit_tx = {
            'from': wallet,
            'to': weth_token,
            'data': deposit_data,
            'value': amount,
        }
        show_metamask_tx(deposit_tx, 'Deposit MetaMask call')

        withdraw_call = weth_contract.functions.withdraw(amount)
        withdraw_data = withdraw_call._encode_transaction_data()
        withdraw_tx = {
            'from': wallet,
            'to': weth_token,
            'data': withdraw_data,
        }
        show_metamask_tx(withdraw_tx, 'Withdraw MetaMask call')


if __name__ == '__main__':
    asyncio.run(main())
