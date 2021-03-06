const path = require("path");
const tester = require("circom").tester;
const chai = require("chai");
const assert = chai.assert;
const circomlib = require("circomlib");
const smt = require("circomlib").smt;

export {};

describe("deposit test", function () {
    this.timeout(200000);


    it("Test Deposit", async () => {
        const circuit = await tester(
            path.join(__dirname, "main", "deposit.circom"),
            {reduceConstraints: false}
        );

        const nLevels = 4;
        const secret = "1234567890";

        const coinCode = "0";
        const amount = '1000000000000000000';
        // const nullifier = "567891234";

        const poseidon = circomlib.poseidon.createHash(6, 8, 57);
        const nullifier = poseidon([2, secret]);
        const commitment = poseidon([coinCode, amount, secret, nullifier]).toString();

        // add commitment into SMT
        let tree = await smt.newMemEmptyTrie();
        await tree.insert(1, 0);
        // await tree.insert(2, 0);

        let rootOld = tree.root;
        let res = await tree.find(2);
        // console.log(res);
        assert(!res.found);
        let siblingsOld = res.siblings;
        while (siblingsOld.length < nLevels) {
            siblingsOld.push("0");
        };
        console.log("siblingsOld", siblingsOld);

        await tree.insert(2, commitment);
        let rootNew = tree.root;

        res = await tree.find(2);
        // console.log(res);
        assert(res.found);
        let siblingsNew = res.siblings;
        while (siblingsNew.length < nLevels) {
            siblingsNew.push("0");
        };
        console.log("siblingsNew", siblingsNew);
        console.log("rootOld", rootOld);
        console.log("rootNew", rootNew);
        
        const witness = await circuit.calculateWitness({
            "coinCode": coinCode,
            "amount": amount,
            "secret": secret,
            "oldKey": "1",
            "oldValue": "0",
            "siblingsOld": siblingsOld,
            "siblingsNew": siblingsNew,
            "rootOld": rootOld,
            "rootNew": rootNew,
            "commitment": commitment,
            "key": 2
        });
        await circuit.checkConstraints(witness);
    });
});
