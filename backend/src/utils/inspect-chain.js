require("dotenv").config();
const { initBlockchain, getAllElectionsFromChain, getElectionCandidatesFromChain, getVoterStatusFromChain } = require("./blockchain.service");
const { ethers } = require("ethers");

(async () => {
  await initBlockchain();
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const block = await provider.getBlockNumber();
  console.log("Block number:", block);
  const els = await getAllElectionsFromChain();
  for (const e of els) {
    console.log(`\nElection ${e.id}: "${e.title}"  active=${e.active} finalized=${e.finalized}`);
    console.log(`  start=${new Date(Number(e.startTime) * 1000).toISOString()}`);
    console.log(`  end  =${new Date(Number(e.endTime) * 1000).toISOString()}`);
    console.log(`  candidateIds=[${e.candidateIds.map(String).join(",")}]`);
    const cands = await getElectionCandidatesFromChain(e.id);
    cands.forEach((c) => console.log(`    - id=${c.id} ${c.name} (${c.party})`));
  }
  const voter = "0x1c1608fe74a2559a5352f9704ebd5b19d699bcd8";
  for (const e of els) {
    const s = await getVoterStatusFromChain(e.id, voter);
    console.log(`\nVoter ${voter} on election ${e.id}:`, s);
  }
  process.exit(0);
})();
