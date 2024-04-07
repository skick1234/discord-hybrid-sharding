"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRecommendedShards = exports.shardIdForGuildId = exports.makePlainError = exports.delayFor = exports.chunkArray = exports.generateNonce = void 0;
const https_1 = require("https");
const shared_1 = require("../types/shared");
function generateNonce() {
    return Date.now().toString(36) + Math.random().toString(36);
}
exports.generateNonce = generateNonce;
function chunkArray(array, chunkSize) {
    const R = [];
    for (let i = 0; i < array.length; i += chunkSize)
        R.push(array.slice(i, i + chunkSize));
    return R;
}
exports.chunkArray = chunkArray;
function delayFor(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
exports.delayFor = delayFor;
function makePlainError(err) {
    return {
        name: err['name'],
        message: err['message'],
        stack: err['stack'],
    };
}
exports.makePlainError = makePlainError;
function shardIdForGuildId(guildId, totalShards = 1) {
    const shard = Number(BigInt(guildId) >> BigInt(22)) % totalShards;
    if (shard < 0)
        throw new Error('SHARD_MISCALCULATION_SHARDID_SMALLER_THAN_0 ' +
            `Calculated Shard: ${shard}, guildId: ${guildId}, totalShards: ${totalShards}`);
    return shard;
}
exports.shardIdForGuildId = shardIdForGuildId;
async function fetchRecommendedShards(token, guildsPerShard = 1000) {
    if (!token)
        throw new Error('DISCORD_TOKEN_MISSING');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bot ${token.replace(/^Bot\s*/i, '')}`,
        },
    };
    return new Promise((resolve, reject) => {
        const req = (0, https_1.request)(`${shared_1.DefaultOptions.http.api}/v${shared_1.DefaultOptions.http.version}${shared_1.Endpoints.botGateway}`, options, res => {
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const responseData = JSON.parse(data);
                    resolve(responseData.shards * (1000 / guildsPerShard));
                }
                else if (res.statusCode === 401) {
                    reject(new Error('DISCORD_TOKEN_INVALID'));
                }
                else {
                    reject(new Error(`Failed to fetch data. Status code: ${res.statusCode}`));
                }
            });
        });
        req.on('error', error => {
            reject(error);
        });
        req.end();
    });
}
exports.fetchRecommendedShards = fetchRecommendedShards;
