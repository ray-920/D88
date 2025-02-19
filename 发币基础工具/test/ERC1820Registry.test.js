const ERC1820Registry = artifacts.require("ERC1820Registry");
const TestERC1820Implementer = artifacts.require("TestERC1820Implementer");

contract("ERC1820Registry", accounts => {
    let registry;
    let implementer;
    const [owner, user1, user2] = accounts;
    const interfaceName = "TestInterface";
    const interfaceHash = web3.utils.keccak256(interfaceName);
    const ERC1820_ACCEPT_MAGIC = web3.utils.keccak256("ERC1820_ACCEPT_MAGIC");
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    before(async () => {
        // 使用已部署的ERC1820Registry
        registry = await ERC1820Registry.at("0x3C81F3BF119df15Fa1E523D1d1d2053b247C5802");
        // 部署测试实现合约
        implementer = await TestERC1820Implementer.new();
        console.log("Test implementer deployed at:", implementer.address);
    });

    describe("基本功能测试", () => {
        it("应该能够获取正确的管理员", async () => {
            const manager = await registry.getManager(owner);
            assert.equal(manager.toLowerCase(), owner.toLowerCase(), "默认管理员应该是账户本身");
        });

        it("应该能够计算接口哈希", async () => {
            const hash = await registry.interfaceHash(interfaceName);
            assert.equal(hash, interfaceHash, "接口哈希计算应该正确");
        });
    });

    describe("管理员功能测试", () => {
        it("应该能够更改管理员", async () => {
            await registry.setManager(owner, user2, { from: owner });
            const newManager = await registry.getManager(owner);
            assert.equal(newManager.toLowerCase(), user2.toLowerCase(), "新管理员应该正确设置");

            // 恢复原始管理员
            await registry.setManager(owner, owner, { from: user2 });
        });

        it("非管理员不能设置接口实现", async () => {
            try {
                await registry.setInterfaceImplementer(owner, interfaceHash, user1, { from: user2 });
                assert.fail("应该抛出异常");
            } catch (error) {
                assert(error.message.includes("Not the manager"), "错误消息不正确");
            }
        });
    });

    describe("接口实现测试", () => {
        before(async () => {
            // 设置测试实现合约支持接口
            await implementer.setInterfaceSupport(interfaceHash, owner, true);
        });

        it("应该能够设置和获取接口实现", async () => {
            await registry.setInterfaceImplementer(owner, interfaceHash, implementer.address, { from: owner });
            const registeredImplementer = await registry.getInterfaceImplementer(owner, interfaceHash);
            assert.equal(registeredImplementer.toLowerCase(), implementer.address.toLowerCase(), "接口实现者应该正确设置");
        });

        it("不能设置不支持接口的实现者", async () => {
            try {
                await registry.setInterfaceImplementer(owner, web3.utils.keccak256("UnsupportedInterface"), implementer.address, { from: owner });
                assert.fail("应该抛出异常");
            } catch (error) {
                assert(error.message.includes("Does not implement the interface"), "错误消息不正确");
            }
        });

        it("零地址查询应该返回msg.sender", async () => {
            const impl = await registry.getInterfaceImplementer(ZERO_ADDRESS, interfaceHash);
            const expected = await registry.getInterfaceImplementer(accounts[0], interfaceHash);
            assert.equal(impl.toLowerCase(), expected.toLowerCase(), "零地址查询结果不正确");
        });
    });

    describe("事件测试", () => {
        it("设置接口实现应该触发事件", async () => {
            const result = await registry.setInterfaceImplementer(owner, interfaceHash, implementer.address, { from: owner });
            
            assert.equal(result.logs.length, 1, "应该只触发一个事件");
            assert.equal(result.logs[0].event, "InterfaceImplementerSet", "事件名称错误");
            assert.equal(result.logs[0].args.addr.toLowerCase(), owner.toLowerCase(), "地址参数错误");
            assert.equal(result.logs[0].args.interfaceHash, interfaceHash, "接口哈希参数错误");
            assert.equal(result.logs[0].args.implementer.toLowerCase(), implementer.address.toLowerCase(), "实现者地址参数错误");
        });

        it("设置管理员应该触发事件", async () => {
            const result = await registry.setManager(owner, user2, { from: owner });
            
            assert.equal(result.logs.length, 1, "应该只触发一个事件");
            assert.equal(result.logs[0].event, "ManagerChanged", "事件名称错误");
            assert.equal(result.logs[0].args.addr.toLowerCase(), owner.toLowerCase(), "地址参数错误");
            assert.equal(result.logs[0].args.newManager.toLowerCase(), user2.toLowerCase(), "新管理员地址参数错误");

            // 恢复原始管理员
            await registry.setManager(owner, owner, { from: user2 });
        });
    });
}); 