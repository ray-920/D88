// SPDX-License-Identifier: MIT
pragma solidity ^0.5.3;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

// 定义ERC1820注册表地址
address constant private ERC1820_REGISTRY_ADDR = 0x3C81F3BF119df15Fa1E523D1d1d2053b247C5802;

// 定义ERC777Token接口的hash
bytes32 constant private ERC777_INTERFACE_HASH = keccak256("ERC777Token");

// 创建TT77Token合约，继承ERC777标准
contract TT77Token is ERC777 {

    // 代币初始供应量设置为1亿个，考虑18位小数
    uint256 private constant INITIAL_SUPPLY = 100000000 * 10**18;

    // 合约构造函数
    constructor(
        address[] memory defaultOperators // 默认操作者
    ) 
        public 
        ERC777(
            "TT77Token",  // 代币名称
            "TT77",       // 代币符号
            defaultOperators // 操作者地址列表
        ) 
    {
        // 铸造初始供应量
        _mint(msg.sender, INITIAL_SUPPLY, "", "");

        // 将该合约注册为ERC777Token接口的实现者
        ERC1820Registry(ERC1820_REGISTRY_ADDR).setInterfaceImplementer(address(this), ERC777_INTERFACE_HASH, address(this));
    }

    // 发送代币时的钩子
    function tokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    )
        public
        override
    {
        // 这里可以添加自定义逻辑，例如验证发送者和接收者的信息，处理代币发送前的事件等
        // 调用ERC777的默认行为
        super.tokensToSend(operator, from, to, amount, userData, operatorData);
    }

    // 接收代币时的钩子
    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    )
        public
        override
    {
        // 这里可以添加自定义逻辑，例如处理接收代币时的事件等
        // 调用ERC777的默认行为
        super.tokensReceived(operator, from, to, amount, userData, operatorData);
    }
}

// ERC1820 注册表接口定义
interface ERC1820Registry {
    function setInterfaceImplementer(address addr, bytes32 interfaceHash, address implementer) external;
}
