// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title D88Airdrop
 * @dev D88代币空投合约
 * 
 * 主要功能：
 * 1. 查询功能：
 *    - 转入1.88个d88，查询该地址的一级推荐人数
 *    - 转入2.88个d88，查询该地址的二级推荐人数
 *    - 转入10.88个d88，查询系统独立地址数量
 *    - 转入30.88个d88，刷新合约数据与MongoDB同步
 * 
 * 2. 空投功能：
 *    - 接收用户转入的代币
 *    - 根据MongoDB中的推荐关系进行分配
 *    - 支持owner取回任意ERC20代币
 */
contract D88Airdrop is Ownable, ReentrancyGuard {
    // D88代币合约地址
    address public constant D88_TOKEN = 0xf37a70365686BF2A1148b692B92773D9F58e365C;

    // 查询金额常量
    uint256 public constant QUERY_LEVEL1_AMOUNT = 1.88 ether;
    uint256 public constant QUERY_LEVEL2_AMOUNT = 2.88 ether;
    uint256 public constant QUERY_SYSTEM_AMOUNT = 10.88 ether;
    uint256 public constant SYNC_DATA_AMOUNT = 30.88 ether;

    // 事件定义
    event QueryProcessed(address indexed user, uint256 amount, uint256 result);
    event TokensAirdropped(address indexed token, address indexed recipient, uint256 amount);

    /**
     * @dev 接收代币并处理查询请求
     * @param amount 转入金额
     */
    function processQuery(uint256 amount) external nonReentrant {
        require(
            IERC20(D88_TOKEN).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        uint256 response;
        if (amount == QUERY_LEVEL1_AMOUNT) {
            response = _handleLevel1Query(msg.sender);
        } else if (amount == QUERY_LEVEL2_AMOUNT) {
            response = _handleLevel2Query(msg.sender);
        } else if (amount == QUERY_SYSTEM_AMOUNT) {
            response = _handleSystemQuery(msg.sender);
        } else if (amount == SYNC_DATA_AMOUNT) {
            response = _handleDataSync(msg.sender);
        } else {
            revert("Invalid query amount");
        }

        // 返回查询结果（通过转账金额表示）
        require(
            IERC20(D88_TOKEN).transfer(msg.sender, response),
            "Response transfer failed"
        );

        emit QueryProcessed(msg.sender, amount, response);
    }

    /**
     * @dev 查询一级推荐人数
     */
    function _handleLevel1Query(address user) internal view returns (uint256) {
        // 从MongoDB获取用户的直推人数count
        // 返回 count * 0.001 ether
        return count * 0.001 ether;
    }

    /**
     * @dev 查询二级推荐人数
     */
    function _handleLevel2Query(address user) internal pure returns (uint256) {
        // 实际查询逻辑由后端处理
        // 这里返回一个固定值用于测试
        return 0.00088 ether;
    }

    /**
     * @dev 查询系统独立地址数量
     */
    function _handleSystemQuery(address user) internal pure returns (uint256) {
        // 实际查询逻辑由后端处理
        // 这里返回一个固定值用于测试
        return 0.00000088 ether;
    }

    /**
     * @dev 刷新合约数据
     */
    function _handleDataSync(address user) internal pure returns (uint256) {
        // 实际同步逻辑由后端处理
        // 这里返回一个固定值用于测试
        return 0.00088 ether;
    }

    /**
     * @dev 执行空投
     * @param recipients 接收者地址列表
     * @param amounts 对应的空投金额列表
     */
    function airdrop(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length > 0, "Empty arrays");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Invalid amount");

            require(
                IERC20(D88_TOKEN).transfer(recipients[i], amounts[i]),
                "Transfer failed"
            );

            emit TokensAirdropped(D88_TOKEN, recipients[i], amounts[i]);
        }
    }

    /**
     * @dev 取回任意ERC20代币，仅owner可调用
     */
    function withdrawToken(
        address token,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(
            IERC20(token).transfer(msg.sender, amount),
            "Transfer failed"
        );
    }
} 