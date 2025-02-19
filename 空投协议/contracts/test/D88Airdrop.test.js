const D88Airdrop = artifacts.require("D88Airdrop");
const IERC20 = artifacts.require("IERC20");

contract("D88Airdrop", accounts => {
  const [owner, user1, user2] = accounts;
  let airdropContract;
  let d88Token;

  before(async () => {
    airdropContract = await D88Airdrop.deployed();
    d88Token = await IERC20.at("0xf37a70365686BF2A1148b692B92773D9F58e365C");
  });

  describe("查询功能", () => {
    it("应该能查询一级推荐人数", async () => {
      const amount = web3.utils.toWei("1.88", "ether");
      await d88Token.approve(airdropContract.address, amount, { from: user1 });
      const result = await airdropContract.processQuery(amount, { from: user1 });
      assert.ok(result);
    });

    it("应该能查询二级推荐人数", async () => {
      const amount = web3.utils.toWei("2.88", "ether");
      await d88Token.approve(airdropContract.address, amount, { from: user1 });
      const result = await airdropContract.processQuery(amount, { from: user1 });
      assert.ok(result);
    });

    it("应该能查询系统独立地址数量", async () => {
      const amount = web3.utils.toWei("10.88", "ether");
      await d88Token.approve(airdropContract.address, amount, { from: user1 });
      const result = await airdropContract.processQuery(amount, { from: user1 });
      assert.ok(result);
    });

    it("应该能刷新合约数据", async () => {
      const amount = web3.utils.toWei("30.88", "ether");
      await d88Token.approve(airdropContract.address, amount, { from: user1 });
      const result = await airdropContract.processQuery(amount, { from: user1 });
      assert.ok(result);
    });
  });

  describe("空投功能", () => {
    it("应该能执行空投", async () => {
      const recipients = [user1, user2];
      const amounts = [
        web3.utils.toWei("1", "ether"),
        web3.utils.toWei("2", "ether")
      ];
      await airdropContract.airdrop(recipients, amounts, { from: owner });
    });

    it("非owner不能执行空投", async () => {
      const recipients = [user1];
      const amounts = [web3.utils.toWei("1", "ether")];
      try {
        await airdropContract.airdrop(recipients, amounts, { from: user1 });
        assert.fail("应该抛出错误");
      } catch (error) {
        assert.include(error.message, "Ownable: caller is not the owner");
      }
    });
  });

  describe("代币提取", () => {
    it("owner应该能提取代币", async () => {
      const amount = web3.utils.toWei("1", "ether");
      await airdropContract.withdrawToken(d88Token.address, amount, { from: owner });
    });

    it("非owner不能提取代币", async () => {
      const amount = web3.utils.toWei("1", "ether");
      try {
        await airdropContract.withdrawToken(d88Token.address, amount, { from: user1 });
        assert.fail("应该抛出错误");
      } catch (error) {
        assert.include(error.message, "Ownable: caller is not the owner");
      }
    });
  });
}); 