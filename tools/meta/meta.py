import json
from pathlib import Path


def main() -> None:
    # Params

    replace_urls_with_src = True
    print_meta_to_console = False
    save_meta_to_file = True
    custom_meta_file_path = False

    contract_build_info_strategy = ('latest',)
    # contract_build_info_strategy = ('filename', '00000000000000000000000000000000.json')

    contract_path, contract = 'contracts/XSwap.sol', 'XSwap'
    # contract_path, contract = 'contracts/protocols/MultiChain.sol', 'MultiChainProtocol'

    # Code

    project_root = (Path() / '..' / '..').resolve()
    assert project_root.name == 'xswap-v2'

    build_info_folder = project_root / 'artifacts' / 'build-info'
    contract_build_info_path = None
    match contract_build_info_strategy[0]:
        case 'latest':
            latest_build_info_time = None
            for build_info_path in build_info_folder.iterdir():
                build_info_time = build_info_path.lstat().st_mtime_ns
                if latest_build_info_time is None or latest_build_info_time < build_info_time:
                    contract_build_info_path = build_info_path
                    latest_build_info_time = build_info_time
        case 'filename':
            contract_build_info_path = build_info_folder / contract_build_info_strategy[1]

    assert contract_build_info_path is not None, 'No contract build info found'
    print(f'Contract build info: {contract_build_info_path}')

    with open(contract_build_info_path) as build_info_file:
        build_info_content = build_info_file.read()

    build_info = json.loads(build_info_content)
    contract_meta_str = build_info['output']['contracts'][contract_path][contract]['metadata']
    print(f'{contract} contract meta loaded ({len(contract_meta_str)} chars)')

    if replace_urls_with_src:
        contract_meta = json.loads(contract_meta_str)
        for file, data in contract_meta['sources'].items():
            del data['urls']
            data['content'] = build_info['input']['sources'][file]['content']
        contract_meta_str = json.dumps(contract_meta)

    if print_meta_to_console:
        print(f'{contract} contract meta:')
        print('--- --- ---')
        print(contract_meta_str)
        print('--- --- ---')

    if save_meta_to_file:
        print(f'Save {contract} meta to file')
        if custom_meta_file_path:
            meta_file_path = input('Input path (relative to project root): ')
            meta_file_path = project_root / meta_file_path
        else:
            meta_file_path = project_root / 'artifacts' / f'{contract}-meta.json'
        with open(meta_file_path, 'w') as meta_file:
            meta_file.write(contract_meta_str)
        print(f'{contract} meta has been saved to {meta_file_path}')


if __name__ == '__main__':
    main()
