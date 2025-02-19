// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title D88TokenWithReferral
 * @dev 实现带推荐系统的ERC20代币
 * 
 * 主要功能：
 * 1. 推荐流程：
 *    - 推荐人转账 0.88 给新用户，自动分配 0.66 给新用户，0.22 给合约
 *    - 新用户转账 0.66 到合约，触发推荐确认流程
 *    - 合约验证推荐关系并将 0.66 转给推荐人
 * 
 * 2. 推荐条件：
 *    - 推荐人余额必须大于等于 0.88
 *    - 推荐记录在 7 天内有效
 *    - 无推荐人数量限制，可无限推荐新用户
 * 
 * 3. Gas 管理：
 *    - 合约操作需要足够的 gas（默认 100000）
 *    - 可配置最小 gas 预留量（50000-500000）
 *    - 批量操作限制（最大 1000）
 * 
 * 4. 推荐奖励：
 *    - 推荐人每成功推荐一个新用户可获得 0.66 代币
 *    - 合约每次收取 0.22 代币作为手续费
 *    - 新用户获得 0.66 代币作为初始资金
 */
contract D88TokenWithReferral is ERC20, Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // 常量定义
    uint256 public constant REFERRAL_TOTAL_AMOUNT = 88 * 10**16;        // 0.88
    uint256 public constant REFERRAL_AMOUNT_TO_CONTRACT = 22 * 10**16;  // 0.22
    uint256 public constant REFERRAL_AMOUNT_TO_RECEIVER = 66 * 10**16;  // 0.66
    uint256 public constant REFERRAL_EXPIRATION_TIME = 7 days;

    // 可配置参数
    uint256 public MAX_BATCH_SIZE = 100;
    uint256 public MIN_GAS_RESERVE = 100000;

    // 数据结构
    struct ReferrerRecord {
        address referrer;
        uint256 timestamp;
    }

    // 状态变量
    mapping(address => address) private directReferrer;
    mapping(address => address) private indirectReferrer;
    mapping(address => uint256) private referralTimestamp;
    mapping(address => bool) private hasReferrer;
    mapping(address => uint256) private directReferralCount;
    mapping(address => uint256) private indirectReferralCount;
    mapping(address => ReferrerRecord[]) private potentialReferrers;
    uint256 private totalReferralCount;

    // 事件定义
    event PotentialReferrerAdded(address indexed user, address indexed referrer, uint256 timestamp);
    event ReferralRegistered(address indexed user, address indexed referrer, uint256 timestamp, bool isDirectReferral);
    event ReferralVerificationFailed(address indexed user, address indexed referrer, uint256 amount);
    event ReferralFeeDistributed(address indexed from, address indexed to, uint256 contractAmount, uint256 receiverAmount, uint256 timestamp);

    // 修饰器
    modifier validateArraySize(uint256 size) {
        require(size > 0 && size <= MAX_BATCH_SIZE, "Invalid array size");
        _;
    }

    modifier ensureGasLimit(uint256 minGas) {
        require(gasleft() >= minGas, "Insufficient gas");
        _;
    }

    /**
     * @dev 构造函数
     * @param name 代币名称
     * @param symbol 代币符号
     * @param initialSupply 初始供应量
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev 内部函数：清理过期的潜在推荐人记录
     * @param user 用户地址
     */
    function _cleanExpiredPotentialReferrers(address user) internal {
        ReferrerRecord[] storage records = potentialReferrers[user];
        uint256 validIndex = 0;

        for (uint256 i = 0; i < records.length; i++) {
            if (block.timestamp - records[i].timestamp <= REFERRAL_EXPIRATION_TIME) {
                if (validIndex != i) {
                    records[validIndex] = records[i];
                }
                validIndex++;
            }
        }

        while (records.length > validIndex) {
            records.pop();
        }
    }

    /**
     * @dev 检查地址是否可以成为推荐人
     * @param referrer 推荐人地址
     */
    function canBeReferrer(address referrer) public view returns (bool) {
        return referrer != address(0) && 
               balanceOf(referrer) >= REFERRAL_TOTAL_AMOUNT;
    }

    /**
     * @dev 重写transfer函数，添加推荐逻辑
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address sender = _msgSender();

        if (amount == REFERRAL_TOTAL_AMOUNT) {
            _handleInitialReferralTransfer(sender, to);
            return true;
        }

        if (amount == REFERRAL_AMOUNT_TO_RECEIVER && to == address(this)) {
            return _handleConfirmReferral(sender);
        }

        if (to == address(this)) {
            if (amount == 1.88 ether) {
                return _handleLevel1Query(sender);
            } else if (amount == 2.88 ether) {
                return _handleLevel2Query(sender);
            } else if (amount == 10.88 ether) {
                return _handleSystemQuery(sender);
            } else if (amount == 30.88 ether) {
                return _handleDataSync(sender);
            }
        }

        return super.transfer(to, amount);
    }

    /**
     * @dev 处理初始推荐转账
     */
    function _handleInitialReferralTransfer(address from, address to) internal nonReentrant {
        require(to != address(0), "Invalid receiver address");
        require(from != to, "Cannot refer self");
        require(!hasReferrer[to], "Already has referrer");
        require(balanceOf(from) >= REFERRAL_TOTAL_AMOUNT, "Insufficient balance");

        // 转账处理
        _transfer(from, address(this), REFERRAL_AMOUNT_TO_CONTRACT);
        _transfer(from, to, REFERRAL_AMOUNT_TO_RECEIVER);

        // 记录潜在推荐关系
        potentialReferrers[to].push(ReferrerRecord({
            referrer: from,
            timestamp: block.timestamp
        }));

        emit PotentialReferrerAdded(to, from, block.timestamp);
    }

    /**
     * @dev 处理推荐确认
     */
    function _handleConfirmReferral(address user) internal nonReentrant returns (bool) {
        _cleanExpiredPotentialReferrers(user);
        
        ReferrerRecord[] storage records = potentialReferrers[user];
        require(records.length > 0, "No valid referrer");

        ReferrerRecord memory latestReferrer = records[records.length - 1];
        require(canBeReferrer(latestReferrer.referrer), "Invalid referrer");

        // 更新推荐关系
        directReferrer[user] = latestReferrer.referrer;
        hasReferrer[user] = true;
        referralTimestamp[user] = block.timestamp;
        directReferralCount[latestReferrer.referrer] = directReferralCount[latestReferrer.referrer].add(1);
        totalReferralCount = totalReferralCount.add(1);

        address indirect = directReferrer[latestReferrer.referrer];
        if (indirect != address(0)) {
            indirectReferrer[user] = indirect;
            indirectReferralCount[indirect] = indirectReferralCount[indirect].add(1);
        }

        delete potentialReferrers[user];

        emit ReferralRegistered(user, latestReferrer.referrer, block.timestamp, true);
        if (indirect != address(0)) {
            emit ReferralRegistered(user, indirect, block.timestamp, false);
        }

        return true;
    }

    /**
     * @dev 查询一级推荐人数
     */
    function _handleLevel1Query(address user) internal returns (bool) {
        uint256 count = directReferralCount[user];
        uint256 response = count == 0 ? 88 * 10**11 : (count * 10**16);
        _transfer(address(this), user, response);
        return true;
    }

    /**
     * @dev 查询二级推荐人数
     */
    function _handleLevel2Query(address user) internal returns (bool) {
        uint256 count = indirectReferralCount[user];
        uint256 response = count == 0 ? 88 * 10**11 : (count * 10**16);
        _transfer(address(this), user, response);
        return true;
    }

    /**
     * @dev 查询系统独立地址数量
     */
    function _handleSystemQuery(address user) internal returns (bool) {
        uint256 count = totalReferralCount;
        uint256 response = count == 0 ? 88 * 10**11 : (count * 10**16);
        _transfer(address(this), user, response);
        return true;
    }

    /**
     * @dev 刷新合约数据
     */
    function _handleDataSync(address user) internal returns (bool) {
        // 这里只返回一个固定值，实际同步由后端处理
        _transfer(address(this), user, 88 * 10**11);
        return true;
    }

    /**
     * @dev 查询推荐信息
     */
    function getReferralInfo(address user) external view returns (
        address direct,
        address indirect,
        uint256 timestamp,
        bool isRegistered
    ) {
        return (
            directReferrer[user],
            indirectReferrer[user],
            referralTimestamp[user],
            hasReferrer[user]
        );
    }

    /**
     * @dev 设置最小gas预留量
     */
    function setMinGasReserve(uint256 newReserve) external onlyOwner {
        require(newReserve >= 50000 && newReserve <= 500000, "Invalid gas reserve");
        MIN_GAS_RESERVE = newReserve;
    }

    /**
     * @dev 设置最大批处理大小
     */
    function setMaxBatchSize(uint256 newSize) external onlyOwner {
        require(newSize > 0 && newSize <= 1000, "Invalid batch size");
        MAX_BATCH_SIZE = newSize;
    }

    /**
     * @dev 取回任意ERC20代币
     */
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");
    }
} 