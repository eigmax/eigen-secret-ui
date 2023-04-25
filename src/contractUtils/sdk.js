import {ethers} from "ethers";
import {rawMessage, signEOASignature} from "@eigen-secret/core/dist-browser/utils";
import {SecretAccount, SigningKey} from "@eigen-secret/core/dist-browser/account";
import {SecretSDK} from "@eigen-secret/core/dist-browser/sdk";
import {buildEddsa} from "circomlibjs";
import {
    defaultCircuitPath,
    defaultContractABI,
    defaultContractFile as contractJson,
    defaultServerEndpoint
} from "./common";

export async function buildSdk(alias) {
    // 检查 MetaMask 是否已安装
    if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
    }

    // 请求 MetaMask 连接
    await window.ethereum.request({method: "eth_requestAccounts"});

    // 使用 MetaMask 提供的 Web3 供应商创建 ethers Signer
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const eddsa = await buildEddsa();
    let timestamp = Math.floor(Date.now() / 1000).toString();
    let userAddress = await signer.getAddress();
    console.log("ETH address", userAddress);

    const signature = await signEOASignature(signer, rawMessage, userAddress, alias, timestamp);
    let signingKey = new SigningKey(eddsa);
    let accountKey = new SigningKey(eddsa);
    let newSigningKey1 = new SigningKey(eddsa);
    let newSigningKey2 = new SigningKey(eddsa);

    let sa = new SecretAccount(alias, accountKey, signingKey, accountKey, newSigningKey1, newSigningKey2);
    let secretSDK = new SecretSDK(
        sa,
        defaultServerEndpoint,
        defaultCircuitPath,
        eddsa,
        signer,
        contractJson.spongePoseidon,
        contractJson.tokenRegistry,
        contractJson.poseidon2,
        contractJson.poseidon3,
        contractJson.poseidon6,
        contractJson.rollup,
        contractJson.smtVerifier
    );

    await secretSDK.initialize(defaultContractABI);

    const ctx = {
        alias: sa.alias,
        ethAddress: userAddress,
        rawMessage: rawMessage,
        timestamp: timestamp,
        signature: signature
    };

    return {secretSDK, ctx, sa, signer, accountKey}
}

