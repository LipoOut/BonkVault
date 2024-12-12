import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { BonkVault } from "../target/types/bonk_vault";
import common from "mocha/lib/interfaces/common";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import {
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { min } from "bn.js";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

describe("bonk-vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const connection = provider.connection;

  const payer = (provider.wallet as NodeWallet).payer;

  const program = anchor.workspace.BonkVault as Program<BonkVault>;

  let mint;
  const state = anchor.web3.PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("state")],
    program.programId
  )[0];
  let ata;
  //  const vault = anchor.web3.PublicKey.findProgramAddressSync(
  //   [anchor.utils.bytes.utf8.encode("vault"),
  //     Buffer.from(state)
  //   ],
  //   program.programId
  // );

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  let vault;

  beforeEach(async () => {
    mint = await createMint(connection, payer, payer.publicKey, null, 6).catch(
      (e) => {
        console.log(e);
        throw e;
      }
    );
    console.log("mint", mint);

    ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      provider.publicKey
    );

    console.log(`Your ata is: ${ata.address.toBase58()}`);

    // Mint to ATA
    const mintTx = await mintTo(
      connection,
      payer,
      mint,
      ata.address,
      provider.publicKey,
      BigInt(1000000000) * BigInt(10000)
    );

    console.log(`Your mint txid: ${mintTx}`);
  
    console.log("mint", mint);
    console.log("state", state);
    vault = getAssociatedTokenAddressSync(mint, state, true, TOKEN_PROGRAM_ID);
  });

  const accounts = {
    mint: mint?.publicKey,
    state,
    userAta: ata,
    vault,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
    systemProgram: SYSTEM_PROGRAM_ID
  };

  console.log(accounts);
  it("initialize!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accountsPartial({
        user: payer.publicKey,
        mint: mint,
        state: state,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([payer])
      .rpc()
      .then(confirm);
    console.log("Your transaction signature", tx);
    let info = await connection.getTokenAccountBalance(ata.address);
    console.log("user ata", info);
  });
  it("stake", async () => {
    // Add your test here.
    const tx = await program.methods
      .deposit(new anchor.BN(1000000000))
      .accountsPartial({
        user: payer.publicKey,
        mint: mint,
        state: state,
        vault: vault,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([payer])
      .rpc()
      .then(confirm);
    let userInfo = await connection.getTokenAccountBalance(ata.address);
    console.log("user ata", userInfo);
    console.log("Your transaction signature", tx);
    const info = await connection.getTokenAccountBalance(vault);
    console.log("info", info);
  });
  it("unstake", async () => {
    // Add your test here.
    const tx = await program.methods
      .withdraw()
      .accountsPartial({
        user: payer.publicKey,
        mint: mint,
        state: state,
        vault: vault,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([payer])
      .rpc()
      .then(confirm);
    let info = await connection.getTokenAccountBalance(ata.address);
    let vaultInfo = await connection.getTokenAccountBalance(vault);
    console.log("user ata after", info);
    console.log("vault ata after", vaultInfo);
    console.log("Your transaction signature", tx);
  });
});
