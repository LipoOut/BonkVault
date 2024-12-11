import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { BonkVault } from "../target/types/bonk_vault";

describe("bonk-vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const connection = provider.connection;

  const payer = (provider.wallet as NodeWallet).payer;
  
  const program = anchor.workspace.BonkVault as Program<BonkVault>;

  const state = anchor.web3.PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("state"),
      payer.publicKey.toBuffer()
    ],
    program.programId
  );

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  it("initialize!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
  it("stake", async () => {
    // Add your test here.
    const tx = await program.methods.deposit(new anchor.BN(0.2)).rpc();
    console.log("Your transaction signature", tx);
  });
  it("unstake", async () => {
    // Add your test here.
    const tx = await program.methods.withdraw(new anchor.BN(0.1)).rpc();
    console.log("Your transaction signature", tx);
  });
});

