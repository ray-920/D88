/* ERC1820 Pseudo-introspection Registry Contract
 * This standard defines a universal registry smart contract where any address (contract or regular account) can
 * register which interface it supports and which smart contract is responsible for its implementation.
 *
 * Written in 2019 by Jordi Baylina and Jacques Dafflon
 *
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to
 * this software to the public domain worldwide. This software is distributed without any warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see
 * <http://creativecommons.org/publicdomain/zero/1.0/>.
 *
 * ∀ 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470.
 */

// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/registry/ERC1820Registry.sol";

contract ERC1820Registry {
    bytes32 constant private ERC1820_ACCEPT_MAGIC = keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));
    bytes4 constant private ERC165ID = 0x01ffc9a7;
    bytes4 constant private INVALID_ID = 0xffffffff;

    mapping(address => mapping(bytes32 => address)) internal implementations;
    mapping(address => address) internal managers;
    mapping(address => mapping(bytes4 => bool)) internal erc165Cached;

    event InterfaceImplementerSet(address indexed addr, bytes32 indexed interfaceHash, address indexed implementer);
    event ManagerChanged(address indexed addr, address indexed newManager);

    /// @notice Query if an address implements an interface and through which contract.
    /// @param _addr Address being queried for the implementer of an interface.
    /// (If '_addr' is the zero address then 'msg.sender' is assumed.)
    /// @param _interfaceHash Keccak256 hash of the name of the interface as a string.
    /// E.g., 'web3.utils.keccak256("ERC777TokensRecipient")' for the 'ERC777TokensRecipient' interface.
    /// @return The address of the contract which implements the interface '_interfaceHash' for '_addr'
    /// or '0' if '_addr' did not register an implementer for this interface.
    function getInterfaceImplementer(address _addr, bytes32 _interfaceHash) external view returns (address) {
        address addr = _addr == address(0) ? msg.sender : _addr;
        if (isERC165Interface(_interfaceHash)) {
            bytes4 erc165InterfaceHash = bytes4(_interfaceHash);
            return implementsERC165Interface(addr, erc165InterfaceHash) ? addr : address(0);
        }
        return implementations[addr][_interfaceHash];
    }

    /// @notice Sets the contract which implements a specific interface for an address.
    /// Only the manager defined for that address can set it.
    /// (Each address is the manager for itself until it sets a new manager.)
    /// @param _addr Address for which to set the interface.
    /// (If '_addr' is the zero address then 'msg.sender' is assumed.)
    /// @param _interfaceHash Keccak256 hash of the name of the interface as a string.
    /// E.g., 'web3.utils.keccak256("ERC777TokensRecipient")' for the 'ERC777TokensRecipient' interface.
    /// @param _implementer Contract address implementing '_interfaceHash' for '_addr'.
    function setInterfaceImplementer(address _addr, bytes32 _interfaceHash, address _implementer) external {
        address addr = _addr == address(0) ? msg.sender : _addr;
        require(getManager(addr) == msg.sender, "Not the manager");

        require(!isERC165Interface(_interfaceHash), "Must not be an ERC165 hash");
        if (_implementer != address(0) && _implementer != msg.sender) {
            require(
                ERC1820ImplementerInterface(_implementer)
                    .canImplementInterfaceForAddress(_interfaceHash, addr) == ERC1820_ACCEPT_MAGIC,
                "Does not implement the interface"
            );
        }
        implementations[addr][_interfaceHash] = _implementer;
        emit InterfaceImplementerSet(addr, _interfaceHash, _implementer);
    }

    /// @notice Sets '_newManager' as manager for '_addr'.
    /// The new manager will be able to call 'setInterfaceImplementer' for '_addr'.
    /// @param _addr Address for which to set the new manager.
    /// @param _newManager Address of the new manager for 'addr'. (Pass '0x0' to reset the manager to '_addr'.)
    function setManager(address _addr, address _newManager) external {
        require(getManager(_addr) == msg.sender, "Not the manager");
        managers[_addr] = _newManager == _addr ? address(0) : _newManager;
        emit ManagerChanged(_addr, _newManager);
    }

    /// @notice Get the manager of an address.
    /// @param _addr Address for which to return the manager.
    /// @return Address of the manager for a given address.
    function getManager(address _addr) public view returns(address) {
        return managers[_addr] == address(0) ? _addr : managers[_addr];
    }

    /// @notice Compute the keccak256 hash of an interface given its name.
    /// @param _interfaceName Name of the interface.
    /// @return The keccak256 hash of an interface name.
    function interfaceHash(string calldata _interfaceName) external pure returns(bytes32) {
        return keccak256(abi.encodePacked(_interfaceName));
    }

    function isERC165Interface(bytes32 _interfaceHash) internal pure returns (bool) {
        return _interfaceHash & 0x00000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF == 0;
    }

    /* --- ERC165 Related Functions --- */
    /* --- Developed in collaboration with William Entriken. --- */

    /// @notice Updates the cache of ERC165 implementations.
    /// @param _contract Address of the contract for which to update the cache.
    /// @param _interfaceId ERC165 interface for which to update the cache.
    function updateERC165Cache(address _contract, bytes4 _interfaceId) external {
        implementations[_contract][_interfaceId] = implementsERC165InterfaceNoCache(
            _contract, _interfaceId) ? _contract : address(0);
        erc165Cached[_contract][_interfaceId] = true;
    }

    /// @notice Checks whether a contract implements ERC165 or not.
    /// @param _contract Address of the contract to check.
    /// @param _interfaceId ERC165 interface to check.
    /// @return True if '_contract' implements ERC165, false otherwise.
    function implementsERC165Interface(address _contract, bytes4 _interfaceId) public view returns (bool) {
        if (!erc165Cached[_contract][_interfaceId]) {
            return implementsERC165InterfaceNoCache(_contract, _interfaceId);
        }
        return implementations[_contract][_interfaceId] == _contract;
    }

    /// @notice Checks whether a contract implements ERC165 or not (without using nor updating the cache).
    /// @param _contract Address of the contract to check.
    /// @return True if '_contract' implements ERC165, false otherwise.
    function implementsERC165InterfaceNoCache(address _contract, bytes4 _interfaceId) public view returns (bool) {
        uint256 success;
        uint256 result;

        (success, result) = noThrowCall(_contract, ERC165ID);
        if (success == 0 || result == 0) {
            return false;
        }

        (success, result) = noThrowCall(_contract, INVALID_ID);
        if (success == 0 || result != 0) {
            return false;
        }

        (success, result) = noThrowCall(_contract, _interfaceId);
        if (success == 1 && result == 1) {
            return true;
        }
        return false;
    }

    function noThrowCall(address _contract, bytes4 _interfaceId)
        internal view returns (uint256 success, uint256 result)
    {
        bytes4 erc165ID = ERC165ID;

        assembly {
            let x := mload(0x40)
            mstore(x, erc165ID)
            mstore(add(x, 0x04), _interfaceId)

            success := staticcall(
                30000,
                _contract,
                x,
                0x24,
                x,
                0x20
            )

            result := mload(x)
        }
    }
}

interface ERC1820ImplementerInterface {
    /// @notice Indicates whether the contract implements the interface 'interfaceHash' for the address 'addr' or not.
    /// @param interfaceHash keccak256 hash of the name of the interface
    /// @param addr Address for which the contract will implement the interface
    /// @return ERC1820_ACCEPT_MAGIC only if the contract implements 'interfaceHash' for the address 'addr'.
    function canImplementInterfaceForAddress(bytes32 interfaceHash, address addr) external view returns(bytes32);
} 