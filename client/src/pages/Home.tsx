import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Ban, BadgeCheck, CalendarClock, CheckCircle2, CircleAlert, ClipboardList, Loader2, PhoneOutgoing, RefreshCcw, ShieldCheck, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Profile = { institution?: string; academicYear?: string; courses?: Array<{ name: string; duration: string; fee: string }>; sourceUrls?: string[]; liveActivation?: { eligible: boolean; reason: string } };
type Outcome = "interested" | "callback" | "not_interested" | "dnc";

const outcomeStyles: Record<Outcome, string> = {
  interested: "bg-[#def5ee] text-[#075f59]",
  callback: "bg-[#e6edff] text-[#264f98]",
  not_interested: "bg-[#eef1f5] text-[#56677c]",
  dnc: "bg-[#ffe9e6] text-[#a64435]",
};

function parseProfile(value: string): Profile | null { try { return JSON.parse(value) as Profile; } catch { return null; } }
function inIst(value: Date | string) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value)); }

export default function Home() {
  const utils = trpc.useUtils();
  const workspace = trpc.voiceAgent.workspace.useQuery(undefined, { retry: false });
  const syncProfiles = trpc.voiceAgent.syncCollegeProfiles.useMutation({ onSuccess: () => utils.voiceAgent.workspace.invalidate() });
  const approve = trpc.voiceAgent.campaigns.approve.useMutation({ onSuccess: () => utils.voiceAgent.workspace.invalidate() });
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number | null>(null);
  const data = workspace.data;
  const campaigns = data?.campaigns.filter(item => !item.knowledgeBase.includes("Northbridge College")) ?? [];
  const campaign = campaigns.find(item => item.id === campaignId) ?? campaigns[0];
  const profile = useMemo(() => campaign ? parseProfile(campaign.knowledgeBase) : null, [campaign]);
  const contacts = (data?.contacts ?? []).filter(contact => !contact.isSynthetic);
  const permitted = contacts.filter(contact => contact.consentStatus === "opt_in" && !contact.dnc);
  const contact = contacts.find(item => item.id === contactId) ?? permitted[0];
  const preflight = trpc.voiceAgent.liveCall.preflight.useQuery({ campaignId: campaign?.id ?? 1, contactId: contact?.id ?? 1 }, { enabled: Boolean(campaign && contact), retry: false });
  const dial = trpc.voiceAgent.liveCall.dial.useMutation({ onSuccess: result => { utils.voiceAgent.workspace.invalidate(); toast.success(`Live call started: ${result.call.roomName}`); }, onError: error => toast.error(error.message) });
  const records = (data?.records ?? []).filter(record => !record.isSynthetic);

  if (workspace.isLoading) return <Loading />;
  if (workspace.error) return <Failure message={workspace.error.message} onRetry={() => workspace.refetch()} />;
  if (!campaign) return <InitializeProfiles running={syncProfiles.isPending} onRun={() => syncProfiles.mutate()} />;

  const profileEligible = profile?.liveActivation?.eligible === true;
  const campaignApproved = campaign.status === "approved";
  const contactEligible = Boolean(contact && contact.consentStatus === "opt_in" && !contact.dnc);
  const providerReady = preflight.data?.providerConfigured === true;
  const ready = profileEligible && campaignApproved && contactEligible && providerReady && preflight.data?.allowed === true;
  const gates = [
    { title: "College profile", pass: profileEligible, detail: profileEligible ? "Current official facts are cleared for live use." : profile?.liveActivation?.reason ?? "Complete the college profile before live use." },
    { title: "Campaign", pass: campaignApproved, detail: campaignApproved ? "Approved for outbound calling." : "Approval is required before a controlled call." },
    { title: "Contact permission", pass: contactEligible, detail: contactEligible ? "Documented opt-in and no DNC flag." : "Choose a permitted, consented contact." },
    { title: "Provider", pass: providerReady, detail: providerReady ? "LiveKit and SIP path are configured." : "LiveKit, trunk, caller identity, and live-call activation are not configured yet." },
  ];

  return <div className="mx-auto max-w-[1440px] pb-10 text-[#10213b]">
    <header className="mb-7 flex flex-col justify-between gap-5 border-b border-[#dce4ee] pb-6 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold tracking-[0.08em] text-[#0d6e6e]">OUTBOUND OPERATIONS</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Live college voice-agent control.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c6d83]">This console prepares the selected institution and permitted contact. Continuous speech, interruption handling, and real call audio run in the LiveKit agent service—not in a browser chat.</p></div><div className="rounded-xl border border-[#d8e6ee] bg-white px-4 py-3 text-xs leading-5 text-[#5e7085]"><ShieldCheck className="mr-1.5 inline h-4 w-4 text-[#0d6e6e]" />Live dialling remains disabled until provider credentials and the controlled test path are verified.</div></header>

    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Metric label="Live readiness" value={ready ? "Ready" : "Blocked"} note={ready ? "Controlled call can be confirmed" : "Complete the gates below"} tone={ready ? "teal" : "amber"} /><Metric label="Permitted contacts" value={permitted.length} note="Consent checks pass" tone="blue" /><Metric label="Callbacks" value={data?.callbacks.length ?? 0} note="Admissions-team follow-up" tone="slate" /><Metric label="DNC requests" value={records.filter(record => record.outcome === "dnc").length} note="Suppressed from dialling" tone="rose" /></section>

    <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]"><div className="overflow-hidden rounded-2xl border border-[#dce4ee] bg-white"><div className="border-b border-[#e6ecf2] px-5 py-5"><h2 className="text-lg font-semibold tracking-[-0.025em]">Controlled call preparation</h2><p className="mt-1 text-sm text-[#5c6d83]">Select the college campaign and contact. The system rechecks these server-side before any provider call is attempted.</p></div><div className="grid gap-5 border-b border-[#e6ecf2] p-5 md:grid-cols-2"><Field title="College campaign"><Select value={String(campaign.id)} onValueChange={value => setCampaignId(Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{campaigns.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></Field><Field title="Permitted contact"><Select value={contact ? String(contact.id) : undefined} onValueChange={value => setContactId(Number(value))}><SelectTrigger><SelectValue placeholder="No permitted contact" /></SelectTrigger><SelectContent>{contacts.map(item => <SelectItem key={item.id} value={String(item.id)} disabled={item.dnc || item.consentStatus !== "opt_in"}>{item.fullName} · {item.language}{item.dnc ? " · DNC" : ""}</SelectItem>)}</SelectContent></Select></Field></div><div className="grid gap-2 p-5">{gates.map(gate => <div key={gate.title} className="flex items-start gap-3 rounded-xl border border-[#e1e8ef] bg-[#fbfcfe] p-3"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${gate.pass ? "bg-[#dff5ef] text-[#0d806f]" : "bg-[#fff1dd] text-[#a66717]"}`}>{gate.pass ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}</span><div><p className="text-xs font-semibold text-[#304b63]">{gate.title}</p><p className="mt-0.5 text-xs leading-5 text-[#6b7d92]">{gate.detail}</p></div></div>)}</div><div className="flex flex-wrap justify-between gap-3 border-t border-[#e6ecf2] bg-[#fbfcfe] p-5"><div className="text-xs leading-5 text-[#617389]">The final action requires explicit confirmation immediately before a live call is placed.</div><Dialog><DialogTrigger asChild><Button disabled={!ready || dial.isPending} className="bg-[#0d6e6e] text-white hover:bg-[#095d5d]"><PhoneOutgoing className="mr-2 h-4 w-4" />Start controlled call</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Confirm real outbound call</DialogTitle><DialogDescription>This sends a real call to the selected permitted contact through the configured SIP carrier. Confirm you have authority to call this number now.</DialogDescription></DialogHeader><Button onClick={() => dial.mutate({ campaignId: campaign.id, contactId: contact?.id ?? 0, userConfirmed: true })} disabled={!contact || dial.isPending} className="bg-[#0d6e6e] text-white hover:bg-[#095d5d]">{dial.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}I confirm and start</Button></DialogContent></Dialog></div></div>
      <aside className="space-y-6"><div className="rounded-2xl border border-[#dce4ee] bg-white p-5"><div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#0d6e6e]" /><h2 className="text-base font-semibold">College knowledge</h2></div><p className="mt-2 text-xs leading-5 text-[#64768b]">{profile?.institution} · {profile?.academicYear}</p><div className="mt-4 space-y-2">{profile?.courses?.map(course => <div key={course.name} className="rounded-xl bg-[#f6f8fb] p-3"><p className="text-xs font-semibold text-[#263f57]">{course.name}</p><p className="mt-1 text-[11px] text-[#687b90]">{course.duration}</p><p className="mt-1 text-[11px] font-medium text-[#3e6272]">{course.fee}</p></div>)}</div></div><div className="rounded-2xl border border-[#dce4ee] bg-white p-5"><div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#4364a7]" /><h2 className="text-base font-semibold">Callback queue</h2></div><p className="mt-3 text-xs leading-5 text-[#6a7b90]">{data?.callbacks.length ? `${data.callbacks.length} callback requests are queued.` : "The live agent will create structured callback events here; n8n can route them later."}</p></div></aside></section>
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#dce4ee] bg-white"><div className="flex items-center justify-between border-b border-[#e6ecf2] p-5"><div><h2 className="text-lg font-semibold">Operational call record</h2><p className="mt-1 text-xs text-[#6a7b90]">Completed provider call outcomes will appear here after activation.</p></div><Button variant="outline" onClick={() => utils.voiceAgent.workspace.invalidate()}><RefreshCcw className="mr-2 h-4 w-4" />Refresh</Button></div>{records.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center p-8 text-center"><PhoneOutgoing className="h-6 w-6 text-[#8b9aab]" /><p className="mt-3 text-sm font-semibold">No live records yet</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-[#fbfcfe] text-[11px] font-semibold tracking-[0.06em] text-[#6d7e92]"><tr><th className="px-5 py-3">CONTACT</th><th className="px-5 py-3">OUTCOME</th><th className="px-5 py-3">SUMMARY</th><th className="px-5 py-3">IST TIME</th></tr></thead><tbody>{records.slice(0, 8).map(record => <tr key={record.id} className="border-t border-[#e9eef3]"><td className="px-5 py-4 text-sm font-semibold">{contacts.find(item => item.id === record.contactId)?.fullName ?? "Contact"}</td><td className="px-5 py-4"><Badge className={outcomeStyles[record.outcome as Outcome]}>{record.outcome.replace("_", " ")}</Badge></td><td className="max-w-sm px-5 py-4 text-xs leading-5 text-[#63758a]">{record.summary}</td><td className="px-5 py-4 text-xs text-[#63758a]">{inIst(record.createdAt)}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}

function Field({ title, children }: { title: string; children: React.ReactNode }) { return <div><p className="mb-2 text-xs font-semibold tracking-[0.06em] text-[#6d7f94]">{title.toUpperCase()}</p>{children}</div>; }
function Metric({ label, value, note, tone }: { label: string; value: string | number; note: string; tone: "teal" | "amber" | "blue" | "slate" | "rose" }) { const color = { teal: "bg-[#e2f5f1] text-[#0d6e6e]", amber: "bg-[#fff1dd] text-[#a66717]", blue: "bg-[#e8efff] text-[#3c5fa8]", slate: "bg-[#f0f3f7] text-[#5c6e83]", rose: "bg-[#ffeae7] text-[#af4e40]" }[tone]; return <div className="rounded-2xl border border-[#dce4ee] bg-white p-4"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}><ShieldCheck className="h-4 w-4" /></span><p className="mt-4 text-xl font-semibold tracking-[-0.03em]">{value}</p><p className="mt-1 text-xs font-semibold text-[#455a70]">{label}</p><p className="mt-1 text-[11px] text-[#728398]">{note}</p></div>; }
function InitializeProfiles({ running, onRun }: { running: boolean; onRun: () => void }) { return <div className="mx-auto flex min-h-[70dvh] max-w-2xl items-center"><div className="rounded-2xl border border-[#dce4ee] bg-white p-9"><PhoneOutgoing className="h-8 w-8 text-[#0d6e6e]" /><h1 className="mt-5 text-2xl font-semibold">Initialize official college profiles</h1><p className="mt-3 text-sm leading-6 text-[#5d6f84]">Load the source-linked Delhi college profiles into the operations console. This action does not make a call.</p><Button onClick={onRun} disabled={running} className="mt-6 bg-[#0d6e6e] text-white hover:bg-[#095d5d]">{running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Initialize profiles</Button></div></div>; }
function Loading() { return <div className="mx-auto max-w-5xl animate-pulse"><div className="h-9 w-96 rounded bg-[#e0e8f0]" /><div className="mt-8 h-[520px] rounded-2xl bg-white" /></div>; }
function Failure({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="mx-auto max-w-xl rounded-2xl border border-[#f3c7c1] bg-white p-8 text-center"><CircleAlert className="mx-auto h-8 w-8 text-[#b64e40]" /><h1 className="mt-4 text-xl font-semibold">Workspace unavailable</h1><p className="mt-2 text-sm text-[#6c5e61]">{message}</p><Button onClick={onRetry} variant="outline" className="mt-6">Try again</Button></div>; }
