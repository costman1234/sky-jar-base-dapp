"use client";

import {
  CloudSun,
  Loader2,
  Search,
  Sparkles,
  SunMedium,
  ThermometerSun,
  Wallet,
  Wind,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_FEEL_LENGTH,
  MAX_MOOD_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_SKY_LENGTH,
  skyJarAbi,
  skyJarContractAddress,
} from "@/lib/sky-jar";

const SKIES = ["Blue break", "Cloud shelf", "Rain light", "Gold hour"] as const;
const MOODS = ["Calm", "Bright", "Heavy", "Open"] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid sky")) return "Choose a short sky.";
  if (error.message.includes("Invalid feel")) return "Feel needs 1 to 24 characters.";
  if (error.message.includes("Invalid mood")) return "Choose a short mood.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 180 characters.";
  return error.message;
}

function SkyCard({
  sky,
  feel,
  mood,
  note,
  observer,
  createdAt,
}: {
  sky: string;
  feel: string;
  mood: string;
  note: string;
  observer?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className="relative overflow-hidden rounded-[8px] border border-[#266078] bg-[#eefaff] p-5 text-[#153348] shadow-[0_28px_90px_rgba(34,98,128,0.2)] sm:p-7">
      <div className="absolute right-[-100px] top-[-110px] h-96 w-96 rounded-full bg-[#ffd166]" />
      <div className="absolute bottom-[-160px] left-[-120px] h-96 w-96 rounded-full bg-[#a8dadc]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#40798c]">
              Sky Jar
            </p>
            <h2 className="mt-4 max-w-3xl break-words text-5xl font-black leading-none sm:text-7xl">
              {sky || "Untitled sky"}
            </h2>
          </div>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[8px] border border-[#153348] bg-[#153348] text-[#eefaff]">
            <CloudSun className="h-9 w-9" />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[8px] border border-[#266078] bg-[#153348] p-5 text-[#eefaff]">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd166]">Feel</p>
            <p className="mt-2 text-4xl font-black">{feel}</p>
          </div>
          <div className="rounded-[8px] border border-[#266078] bg-[#ffd166] p-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#8a5b00]">Mood</p>
            <p className="mt-2 text-4xl font-black">{mood}</p>
          </div>
        </div>

        <section className="mt-5 rounded-[8px] border border-[#266078] bg-[#fbfeff] p-5">
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-[#40798c]" />
            <h3 className="text-xl font-black">Sky note</h3>
          </div>
          <p className="mt-4 min-h-[190px] whitespace-pre-wrap text-2xl font-bold leading-10">
            {note || "Save the weather while it still feels specific."}
          </p>
        </section>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[8px] border border-[#266078] bg-[#fbfeff] p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#40798c]">Observer</p>
            <p className="mt-2 text-xl font-black">{shortAddress(observer)}</p>
          </div>
          <div className="rounded-[8px] border border-[#266078] bg-[#fbfeff] p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#40798c]">Saved</p>
            <p className="mt-2 text-xl font-black">{formatDate(createdAt)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SkyJarApp() {
  const [noteIdInput, setNoteIdInput] = useState("1");
  const [sky, setSky] = useState<(typeof SKIES)[number]>("Blue break");
  const [feel, setFeel] = useState("Cool wind");
  const [mood, setMood] = useState<(typeof MOODS)[number]>("Open");
  const [note, setNote] = useState("Clouds split for ten minutes. The whole block looked rinsed clean and quiet.");
  const [status, setStatus] = useState("Save a sky note on Base.");
  const [lastAction, setLastAction] = useState<"create" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedNoteId = BigInt(Math.max(1, Number(noteIdInput || "1")));

  const skyQuery = useReadContract({
    abi: skyJarAbi,
    address: skyJarContractAddress,
    functionName: "getSky",
    args: [parsedNoteId],
    query: { enabled: Boolean(skyJarContractAddress), refetchInterval: 12000 },
  });

  const totalQuery = useReadContract({
    abi: skyJarAbi,
    address: skyJarContractAddress,
    functionName: "nextNoteId",
    query: { enabled: Boolean(skyJarContractAddress), refetchInterval: 12000 },
  });

  const tuple = skyQuery.data as
    | readonly [Address, string, string, string, string, bigint]
    | undefined;

  const liveSky = useMemo(
    () =>
      tuple
        ? {
            observer: tuple[0],
            sky: tuple[1],
            feel: tuple[2],
            mood: tuple[3],
            note: tuple[4],
            createdAt: tuple[5],
          }
        : undefined,
    [tuple],
  );

  const totalNotes = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    sky.trim().length > 0 &&
    sky.trim().length <= MAX_SKY_LENGTH &&
    feel.trim().length > 0 &&
    feel.trim().length <= MAX_FEEL_LENGTH &&
    mood.trim().length > 0 &&
    mood.trim().length <= MAX_MOOD_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const createBlocker = !skyJarContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_SKY_JAR_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill sky, feel, mood, and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "create") return;
    void totalQuery.refetch();
    void skyQuery.refetch();
    const logs = parseEventLogs({ abi: skyJarAbi, logs: receipt.logs, eventName: "SkySaved" });
    const noteId = logs[0]?.args.noteId;
    window.setTimeout(() => {
      if (noteId) setNoteIdInput(noteId.toString());
      setStatus(noteId ? `Sky note #${noteId.toString()} saved on Base.` : "Sky note saved on Base.");
    }, 0);
  }, [lastAction, receipt, skyQuery, totalQuery]);

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, queue) => queue.findIndex((item) => item.id === connector.id) === index);

    if (connectorQueue.length === 0) {
      setStatus("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setStatus("Opening wallet connection...");
    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setStatus("Wallet connected. Save a sky note when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setStatus(friendlyError(lastError));
  }

  async function saveSky() {
    const contractAddress = skyJarContractAddress;
    if (createBlocker) {
      setStatus(createBlocker);
      return;
    }
    if (!contractAddress) {
      setStatus("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }
    try {
      setLastAction("create");
      setStatus("Confirm your sky note in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: skyJarAbi,
        functionName: "saveSky",
        args: [sky.trim(), feel.trim(), mood.trim(), note.trim()],
        chainId: base.id,
      });
      setStatus("Sky note sent. Waiting for Base confirmation...");
    } catch (error) {
      setStatus(friendlyError(error));
    }
  }

  return (
    <main className="min-h-screen bg-[#e7f6ff] text-[#153348]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[390px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[8px] border border-[#266078] bg-[#eefaff] p-4 shadow-[0_20px_80px_rgba(34,98,128,0.14)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#40798c]">Sky Jar</p>
              <h1 className="mt-2 text-4xl font-black leading-none">Save a sky note.</h1>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] border border-[#266078] bg-[#ffd166]">
              <SunMedium className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-[#266078] bg-[#fbfeff] p-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#40798c]">Notes</p>
              <p className="mt-2 text-3xl font-black">{totalNotes}</p>
            </div>
            <div className="rounded-[8px] border border-[#266078] bg-[#153348] p-3 text-[#eefaff]">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ffd166]">Chain</p>
              <p className="mt-2 text-xl font-black">Base</p>
            </div>
          </div>

          <section className="mt-4 rounded-[8px] border border-[#266078] bg-[#fbfeff] p-4">
            <h2 className="text-xl font-black">New sky</h2>
            <div className="mt-4 space-y-3">
              <div>
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#40798c]">Sky</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {SKIES.map((value) => (
                    <button key={value} className={`rounded-[8px] border px-2 py-3 text-sm font-black ${value === sky ? "border-[#153348] bg-[#153348] text-[#eefaff]" : "border-[#266078] bg-[#eefaff]"}`} onClick={() => setSky(value)}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#40798c]">Feel</span>
                <input value={feel} onChange={(event) => setFeel(event.target.value)} maxLength={MAX_FEEL_LENGTH} className="mt-1 w-full rounded-[8px] border border-[#266078] bg-[#eefaff] px-3 py-3 font-black outline-none" />
              </label>
              <div>
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#40798c]">Mood</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MOODS.map((value) => (
                    <button key={value} className={`rounded-[8px] border px-2 py-3 text-sm font-black ${value === mood ? "border-[#266078] bg-[#ffd166]" : "border-[#266078] bg-[#eefaff]"}`} onClick={() => setMood(value)}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#40798c]">Note</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_NOTE_LENGTH} rows={4} className="mt-1 w-full rounded-[8px] border border-[#266078] bg-[#eefaff] px-3 py-3 text-sm font-bold leading-6 outline-none" />
              </label>
            </div>
          </section>

          <div className="mt-4 space-y-3">
            {isConnected && chainId !== base.id ? (
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#266078] bg-[#ffd166] px-4 py-3 font-black disabled:opacity-60" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>
                {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Switch to Base
              </button>
            ) : (
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#40798c] px-4 py-3 font-black text-[#eefaff] disabled:opacity-60" disabled={writing || confirming} onClick={saveSky}>
                {writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Save Sky Note
              </button>
            )}
            {isConnected ? (
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#266078] bg-[#eefaff] px-4 py-3 font-black" onClick={disconnectWallet}>{shortAddress(address)}</button>
            ) : (
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#266078] bg-[#eefaff] px-4 py-3 font-black disabled:opacity-60" disabled={!selectedConnector || connecting} onClick={connectWallet}>
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Connect wallet
              </button>
            )}
            <p className="rounded-[8px] border border-[#266078] bg-[#eefaff] px-3 py-3 text-sm font-bold leading-6">{status}</p>
            {hash ? <a className="block rounded-[8px] border border-[#266078] bg-[#153348] px-3 py-3 text-xs font-black leading-5 text-[#ffd166] underline" href={`https://basescan.org/tx/${hash}`} rel="noreferrer" target="_blank">View transaction on BaseScan</a> : null}
            {createBlocker && isConnected ? <p className="rounded-[8px] border border-[#266078] bg-[#fbfeff] px-3 py-3 text-xs font-bold leading-5">{createBlocker}</p> : null}
          </div>
        </aside>

        <section className="grid gap-4">
          <SkyCard sky={liveSky?.sky || sky} feel={liveSky?.feel || feel} mood={liveSky?.mood || mood} note={liveSky?.note ?? note} observer={liveSky?.observer} createdAt={liveSky?.createdAt} />
          <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
            <div className="rounded-[8px] border border-[#266078] bg-[#eefaff] p-4">
              <div className="flex items-center gap-2"><Search className="h-5 w-5" /><h2 className="text-2xl font-black">Load note</h2></div>
              <label className="mt-4 block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#40798c]">Note ID</span>
                <input value={noteIdInput} onChange={(event) => setNoteIdInput(event.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-[8px] border border-[#266078] bg-[#fbfeff] px-3 py-3 text-2xl font-black outline-none" />
              </label>
            </div>
            <div className="rounded-[8px] border border-[#266078] bg-[#eefaff] p-4">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#40798c]">What it does</p>
              <p className="mt-3 max-w-xl text-sm font-bold leading-6">Sky Jar saves a sky note with weather, feel, mood, observer wallet, and timestamp on Base.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#266078] bg-[#fbfeff] px-3 py-2 text-xs font-black"><ThermometerSun className="h-4 w-4 text-[#40798c]" /> Weather feel</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#266078] bg-[#fbfeff] px-3 py-2 text-xs font-black"><CloudSun className="h-4 w-4 text-[#40798c]" /> Sky record</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
