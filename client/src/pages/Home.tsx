import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { AlertTriangle, BadgeCheck, Ban, Bot, CalendarClock, CheckCircle2, ChevronRight, CircleAlert, ClipboardList, FileUp, Headphones, Info, Loader2, MessageSquareText, PhoneCall, PhoneOff, PhoneOutgoing, Play, Plus, RefreshCcw, Send, ShieldAlert, ShieldCheck, Sparkles, UsersRound, Volume2 } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type TranscriptItem = { role: "agent" | "student"; content: string; source?: string };
type Outcome = "interested" | "callback" | "not_interested" | "dnc";

const outcomeMeta: Record<Outcome, { label: string; className: string }> = {
  interested: { label: "Interested", className: "bg-[#def5ee] text-[#075f59]" },
  callback: { label: "Callback", className: "bg-[#e6edff] text-[#264f98]" },
  not_interested: { label: "Not interested", className: "bg-[#eef1f5] text-[#56677c]" },
  dnc: { label: "DNC", className: "bg-[#ffe9e6] text-[#a64435]" },
};

const workflowViews = {
  "/": "overview",
  "/outbound": "outbound",
  "/inbound": "inbound",
  "/delegated": "delegated",
  "/contacts": "contacts",
} as const;

function splitCsvRow(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { cells.push(current.trim()); current = ""; }
    else current += char;
  }
  cells.push(current.trim());
  return cells.map(cell => cell.replace(/^"|"$/g, ""));
}

function toIst(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

function parseStoredJson<T>(value: unknown): T | null {
  if (typeof value !== "string") return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

function speak(text: string, language: "English" | "Hindi") {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "Hindi" ? "hi-IN" : "en-IN";
  utterance.rate = 0.98;
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const view = workflowViews[location as keyof typeof workflowViews] ?? "overview";
  const utils = trpc.useUtils();
  const workspace = trpc.voiceAgent.workspace.useQuery(undefined, { retry: false });
  const seedDemo = trpc.voiceAgent.seedDemo.useMutation({ onSuccess: () => utils.voiceAgent.workspace.invalidate() });
  const approveCampaign = trpc.voiceAgent.campaigns.approve.useMutation({ onSuccess: () => utils.voiceAgent.workspace.invalidate() });
  const addContact = trpc.voiceAgent.contacts.add.useMutation({ onSuccess: () => { utils.voiceAgent.workspace.invalidate(); toast.success("Contact added with documented consent."); } });
  const bulkAdd = trpc.voiceAgent.contacts.bulkAdd.useMutation({ onSuccess: data => { utils.voiceAgent.workspace.invalidate(); toast.success(`${data.count} contacts imported with consent evidence.`); } });
  const startSimulation = trpc.voiceAgent.simulation.start.useMutation();
  const respond = trpc.voiceAgent.simulation.respond.useMutation();
  const finish = trpc.voiceAgent.simulation.finish.useMutation({ onSuccess: () => utils.voiceAgent.workspace.invalidate() });

  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [studentMessage, setStudentMessage] = useState("");
  const [callState, setCallState] = useState<"idle" | "active" | "finishing" | "complete">("idle");
  const [pendingOutcome, setPendingOutcome] = useState<Outcome>("interested");
  const [activeLanguage, setActiveLanguage] = useState<"English" | "Hindi">("English");
  const [summary, setSummary] = useState("");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Array<{ fullName: string; phoneNumber: string; language: "English" | "Hindi"; consentSource: string; consentScope: string }>>([]);
  const transcriptEnd = useRef<HTMLDivElement>(null);

  const data = workspace.data;
  const collegeCampaigns = data?.campaigns.filter(campaign => !(typeof campaign.knowledgeBase === "string" && campaign.knowledgeBase.includes("Northbridge College of Applied Studies"))) ?? [];
  const currentCampaign = collegeCampaigns.find(campaign => campaign.id === selectedCampaignId) ?? collegeCampaigns[0];
  const currentProfile = useMemo(() => {
    if (!currentCampaign) return null;
    return parseStoredJson<{ courses?: Array<{ name: string }> }>(currentCampaign.knowledgeBase);
  }, [currentCampaign]);
  const contacts = data?.contacts ?? [];
  const selectedContact = contacts.find(contact => contact.id === selectedContactId) ?? contacts.find(contact => contact.consentStatus === "opt_in" && !contact.dnc);
  const records = data?.records ?? [];
  const metrics = useMemo(() => ({
    attempts: records.length,
    interested: records.filter(record => record.outcome === "interested").length,
    callbacks: records.filter(record => record.outcome === "callback").length,
    dnc: records.filter(record => record.outcome === "dnc").length,
  }), [records]);

  useEffect(() => {
    if (transcript.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      transcriptEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [transcript.length]);

  const loadDemo = async () => {
    await seedDemo.mutateAsync();
    toast.success("Verified Delhi college profiles are ready.");
  };

  const beginCall = async () => {
    if (!currentCampaign || !selectedContact) return;
    try {
      const result = await startSimulation.mutateAsync({ campaignId: currentCampaign.id, contactId: selectedContact.id });
      setActiveLanguage(result.language);
      const opening = { role: "agent" as const, content: result.opening, source: "Selected college profile opening" };
      setTranscript([opening]);
      setCallState("active");
      setPendingOutcome("interested");
      setSummary("");
      speak(result.opening, result.language);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The simulation could not start.");
    }
  };

  const sendTurn = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!studentMessage.trim() || !currentCampaign || !selectedContact || callState !== "active") return;
    const message = studentMessage.trim();
    setStudentMessage("");
    setTranscript(previous => [...previous, { role: "student", content: message }]);
    try {
      const result = await respond.mutateAsync({ campaignId: currentCampaign.id, contactId: selectedContact.id, message });
      setTranscript(previous => [...previous, { role: "agent", content: result.reply, source: result.source }]);
      setPendingOutcome(result.outcome);
      speak(result.reply, activeLanguage);
      if (result.outcome === "dnc") toast.message("DNC detected. Complete the call to enforce suppression.");
      if (result.requiresHuman) toast.message("Human handoff path is ready when you complete this call.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The response could not be generated.");
    }
  };

  const completeCall = async () => {
    if (!currentCampaign || !selectedContact || transcript.length === 0) return;
    setCallState("finishing");
    try {
      const result = await finish.mutateAsync({ campaignId: currentCampaign.id, contactId: selectedContact.id, outcome: pendingOutcome, transcript: transcript.map(({ role, content }) => ({ role, content })) });
      setSummary(result.summary);
      setCallState("complete");
      window.speechSynthesis?.cancel();
      toast.success(`Synthetic call recorded as ${outcomeMeta[result.outcome].label.toLowerCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The call record could not be saved.");
      setCallState("active");
    }
  };

  const resetCall = () => {
    window.speechSynthesis?.cancel();
    setTranscript([]); setCallState("idle"); setSummary(""); setPendingOutcome("interested");
  };

  const handleCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const lines = content.split(/\r?\n/).filter(Boolean);
    const [headerLine, ...rows] = lines;
    const headers = splitCsvRow(headerLine).map(value => value.toLowerCase().replace(/\s/g, ""));
    const index = (key: string) => headers.indexOf(key);
    const required = ["name", "phone", "language", "consentsource", "consentscope"];
    if (required.some(key => index(key) === -1)) { toast.error("CSV needs headers: name, phone, language, consentSource, consentScope."); return; }
    const preview = rows.slice(0, 500).map(row => {
      const values = splitCsvRow(row);
      return {
        fullName: values[index("name")] || "",
        phoneNumber: values[index("phone")] || "",
        language: values[index("language")]?.toLowerCase().startsWith("hi") ? "Hindi" as const : "English" as const,
        consentSource: values[index("consentsource")] || "",
        consentScope: values[index("consentscope")] || "",
      };
    }).filter(row => row.fullName && row.phoneNumber && row.consentSource && row.consentScope);
    setCsvPreview(preview);
  };

  if (workspace.isLoading) return <WorkspaceSkeleton />;
  if (workspace.error) return <ErrorState message={workspace.error.message} onRetry={() => workspace.refetch()} />;
  if (!data || collegeCampaigns.length === 0) return <SyntheticOnboarding loading={seedDemo.isPending} onLoad={loadDemo} />;
  if (!currentCampaign) return <ErrorState message="No campaign is available for this workspace." onRetry={() => workspace.refetch()} />;

  const policy = data.policies.find(item => item.workflow === (view === "inbound" ? "inbound" : view === "delegated" ? "delegated" : "outbound"));
  const policyContent = policy ? parseStoredJson<{ label: string; permissions: string[]; blocks: string[] }>(policy.policyJson) : null;

  return (
    <div className="mx-auto max-w-[1440px] pb-10 text-[#10213b]">
      <header className="mb-7 border-b border-[#dce4ee] pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0d6e6e]"><span className="inline-flex h-2 w-2 rounded-full bg-[#2ea89d]" />DELHI COLLEGE OUTREACH</div><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-[34px]">Admissions outreach, grounded in official sources.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c6d83]">Select an approved Delhi college profile. Each conversation stays within that college’s independently sourced programme and admissions information.</p>
      </header>

      <Tabs value={view === "overview" ? "outbound" : view} onValueChange={value => setLocation(value === "outbound" ? "/outbound" : `/${value}`)} className="mb-7">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-[#dce4ee] bg-transparent p-0"><TabsTrigger value="outbound" className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-1 text-sm data-[state=active]:border-[#0d6e6e] data-[state=active]:bg-transparent data-[state=active]:text-[#0d6e6e]">Outbound</TabsTrigger><TabsTrigger value="inbound" className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-1 text-sm data-[state=active]:border-[#0d6e6e] data-[state=active]:bg-transparent data-[state=active]:text-[#0d6e6e]">Inbound support</TabsTrigger><TabsTrigger value="delegated" className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-1 text-sm data-[state=active]:border-[#0d6e6e] data-[state=active]:bg-transparent data-[state=active]:text-[#0d6e6e]">Delegated task</TabsTrigger></TabsList>
      </Tabs>

      {view === "inbound" || view === "delegated" ? <WorkflowPolicyView type={view} policy={policyContent} /> : view === "contacts" ? <ContactsView contacts={contacts} records={records} addContact={addContact} bulkAdd={bulkAdd} csvPreview={csvPreview} setCsvPreview={setCsvPreview} handleCsv={handleCsv} dialogOpen={contactDialogOpen} setDialogOpen={setContactDialogOpen} /> : <>
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Metric label="Recorded simulations" value={metrics.attempts} detail="Browser-only demo records" icon={PhoneOutgoing} /><Metric label="Interested" value={metrics.interested} detail="Qualified next-step intent" icon={Sparkles} accent="teal" /><Metric label="Callbacks queued" value={metrics.callbacks} detail="Owner notified immediately" icon={CalendarClock} accent="blue" /><Metric label="DNC requests" value={metrics.dnc} detail="Suppressed at the dialler" icon={Ban} accent="rose" /></section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="rounded-2xl border border-[#dce4ee] bg-white">
            <div className="border-b border-[#e6ecf2] px-5 py-5"><h2 className="text-lg font-semibold tracking-[-0.025em]">Outbound simulation desk</h2><p className="mt-1 text-sm text-[#5c6d83]">Choose a demo contact and run a natural college-information conversation in your browser.</p></div>
            <div className="grid border-b border-[#e6ecf2] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div className="p-5"><p className="text-xs font-semibold tracking-[0.08em] text-[#6e7f94]">ACTIVE COLLEGE PROFILE</p><div className="mt-2 flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold">{currentCampaign.name}</h3><Badge className={currentCampaign.status === "approved" ? "bg-[#def5ee] text-[#075f59] hover:bg-[#def5ee]" : "bg-[#fff1d9] text-[#8b5e1a] hover:bg-[#fff1d9]"}>{currentCampaign.status === "approved" ? "Approved" : "Approval needed"}</Badge></div><p className="mt-2 text-xs leading-5 text-[#6a7b90]">9am–9pm IST · frequency cap {currentCampaign.frequencyCap} · source-linked knowledge base attached</p><div className="mt-4 max-w-md"><Select value={String(currentCampaign.id)} onValueChange={value => { setSelectedCampaignId(Number(value)); resetCall(); }}><SelectTrigger className="h-9 border-[#cfdbe7] bg-white text-sm"><SelectValue placeholder="Choose a college profile" /></SelectTrigger><SelectContent>{collegeCampaigns.map(campaign => <SelectItem key={campaign.id} value={String(campaign.id)}>{campaign.name}</SelectItem>)}</SelectContent></Select></div></div><div className="flex flex-wrap gap-2 px-5 pb-5 lg:pl-0">{currentCampaign.status !== "approved" && <Button onClick={() => approveCampaign.mutate({ campaignId: currentCampaign.id })} disabled={approveCampaign.isPending} className="bg-[#0d6e6e] text-white hover:bg-[#095d5d]">{approveCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Approve campaign</Button>}<Button variant="outline" onClick={loadDemo} disabled={seedDemo.isPending} className="border-[#cfdbe7] text-[#3f586f]">{seedDemo.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Delhi profiles</Button></div></div>
            <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]"><div className="border-b border-[#e6ecf2] bg-[#fbfcfe] p-4 lg:border-b-0 lg:border-r"><p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[#6e7f94]">CONTACTS</p><div className="space-y-2">{contacts.map(contact => <button key={contact.id} onClick={() => { setSelectedContactId(contact.id); resetCall(); }} className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedContact?.id === contact.id ? "border-[#7ac9c1] bg-[#f0fbf9]" : "border-transparent hover:border-[#dce4ee] hover:bg-white"}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{contact.fullName}</span>{contact.dnc ? <Ban className="h-4 w-4 text-[#c55a4b]" /> : <BadgeCheck className="h-4 w-4 text-[#15958a]" />}</div><div className="mt-1 flex items-center gap-1.5 text-xs text-[#697b90]"><span>{contact.language}</span><span>·</span><span>{contact.dnc ? "DNC" : contact.consentStatus === "opt_in" ? "Opted in" : "Blocked"}</span></div></button>)}</div><Button variant="ghost" onClick={() => setLocation("/contacts")} className="mt-3 w-full justify-start text-xs text-[#0d6e6e] hover:bg-[#edf8f7] hover:text-[#095d5d]"><UsersRound className="mr-2 h-3.5 w-3.5" />Manage contacts</Button></div>
              <div className="min-h-[520px] p-4 sm:p-5"><CallSimulator contact={selectedContact} campaignApproved={currentCampaign.status === "approved"} sampleQuestion={`What is the fee for ${currentProfile?.courses?.[0]?.name ?? "this programme"}?`} callState={callState} transcript={transcript} activeLanguage={activeLanguage} message={studentMessage} setMessage={setStudentMessage} pendingOutcome={pendingOutcome} summary={summary} starting={startSimulation.isPending} responding={respond.isPending} finishing={finish.isPending} onStart={beginCall} onSend={sendTurn} onFinish={completeCall} onReset={resetCall} transcriptEnd={transcriptEnd} /></div>
            </div>
          </div>
          <div className="space-y-6"><KnowledgeCard campaign={currentCampaign} /><CallbackQueue callbacks={data.callbacks} contacts={contacts} /></div>
        </section>
        <section className="mt-7 rounded-2xl border border-[#dce4ee] bg-white"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6ecf2] px-5 py-5"><div><h2 className="text-lg font-semibold tracking-[-0.025em]">Simulation record</h2><p className="mt-1 text-sm text-[#5c6d83]">A complete audit trail, including synthetic call outcomes and suppressions.</p></div><Button variant="outline" onClick={() => utils.voiceAgent.workspace.invalidate()} className="border-[#cfdbe7] text-[#344960]"><RefreshCcw className="mr-2 h-3.5 w-3.5" />Refresh</Button></div><CallHistory records={records} contacts={contacts} /></section>
      </>}
    </div>
  );
}

function SyntheticOnboarding({ loading, onLoad }: { loading: boolean; onLoad: () => void }) {
  return <div className="mx-auto flex min-h-[80dvh] max-w-3xl items-center"><div className="w-full rounded-2xl border border-[#dce4ee] bg-white p-7 shadow-[0_18px_48px_rgba(24,47,79,0.07)] sm:p-10"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7f7f5] text-[#0d6e6e]"><PhoneOutgoing className="h-6 w-6" /></div><h1 className="mt-7 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-[#10213b]">Start with a fictional admissions workspace.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5c6d83]">Load a fictional college, sample programmes and fees, and synthetic student contacts to try the conversation simulator in your browser.</p><div className="mt-8 grid gap-3 sm:grid-cols-3"><OnboardingPoint icon={PhoneOutgoing} title="Explore outreach" text="Start a natural college-information conversation." /><OnboardingPoint icon={Bot} title="Try questions" text="Ask about courses, fees, eligibility, and admissions." /><OnboardingPoint icon={ClipboardList} title="Review outcomes" text="See the completed demo conversation in one place." /></div><Button onClick={onLoad} disabled={loading} size="lg" className="mt-8 bg-[#0d6e6e] text-white hover:bg-[#095d5d]">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}Load synthetic demo</Button></div></div>;
}

function OnboardingPoint({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) { return <div className="rounded-xl bg-[#f6f8fb] p-4"><Icon className="h-4 w-4 text-[#0d6e6e]" /><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-[#65768b]">{text}</p></div>; }
function Metric({ label, value, detail, icon: Icon, accent = "slate" }: { label: string; value: number; detail: string; icon: typeof PhoneOutgoing; accent?: "slate" | "teal" | "blue" | "rose" }) { const tone = { slate: "bg-[#f0f3f7] text-[#5c6e83]", teal: "bg-[#e2f5f1] text-[#0d6e6e]", blue: "bg-[#e8efff] text-[#3c5fa8]", rose: "bg-[#ffeae7] text-[#af4e40]" }[accent]; return <div className="rounded-2xl border border-[#dce4ee] bg-white p-4"><div className="flex items-start justify-between"><p className="text-xs font-semibold tracking-[0.05em] text-[#6c7d92]">{label.toUpperCase()}</p><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span></div><p className="mt-5 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{value}</p><p className="mt-1 text-xs text-[#6c7d92]">{detail}</p></div>; }

function CallSimulator({ contact, campaignApproved, sampleQuestion, callState, transcript, activeLanguage, message, setMessage, pendingOutcome, summary, starting, responding, finishing, onStart, onSend, onFinish, onReset, transcriptEnd }: { contact: any; campaignApproved: boolean; sampleQuestion: string; callState: "idle" | "active" | "finishing" | "complete"; transcript: TranscriptItem[]; activeLanguage: "English" | "Hindi"; message: string; setMessage: (value: string) => void; pendingOutcome: Outcome; summary: string; starting: boolean; responding: boolean; finishing: boolean; onStart: () => void; onSend: (event: FormEvent) => void; onFinish: () => void; onReset: () => void; transcriptEnd: React.RefObject<HTMLDivElement | null> }) {
  if (!contact) return <div className="flex h-full min-h-[440px] flex-col items-center justify-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf2f7] text-[#6d7f94]"><UsersRound className="h-6 w-6" /></div><h3 className="mt-4 text-base font-semibold">Choose a synthetic contact</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#65768b]">Only contacts with valid consent and no DNC flag can pass the simulation dialler gate.</p></div>;
  if (callState === "idle") return <div className="flex h-full min-h-[440px] flex-col"><div className="flex flex-1 flex-col items-center justify-center text-center"><div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#e7f7f5] text-[#0d6e6e]"><PhoneCall className="h-8 w-8" /><span className="absolute -right-1 bottom-0 h-5 w-5 rounded-full border-4 border-white bg-[#2ea89d]" /></div><h3 className="mt-5 text-xl font-semibold tracking-[-0.03em]">Ready to speak with {contact.fullName}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#65768b]">{campaignApproved ? `Conversation language: ${contact.language}. Ask about programmes, fees, scholarship, eligibility, or admissions.` : "Approve the campaign to begin this demo."}</p></div><div className="flex items-center justify-between rounded-xl bg-[#f6f8fb] p-3"><div className="flex items-center gap-2 text-xs text-[#5d6f84]"><PhoneCall className="h-4 w-4 text-[#0d6e6e]" />Browser simulation</div><Button onClick={onStart} disabled={!campaignApproved || starting || contact.dnc || contact.consentStatus !== "opt_in"} className="bg-[#0d6e6e] text-white hover:bg-[#095d5d]">{starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}Start demo</Button></div></div>;
  if (callState === "complete") return <div className="flex h-full min-h-[440px] flex-col items-center justify-center text-center"><div className={`flex h-14 w-14 items-center justify-center rounded-full ${outcomeMeta[pendingOutcome].className}`}><CheckCircle2 className="h-7 w-7" /></div><Badge className={`mt-5 ${outcomeMeta[pendingOutcome].className}`}>{outcomeMeta[pendingOutcome].label}</Badge><h3 className="mt-3 text-xl font-semibold">Simulation recorded</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#65768b]">{summary}</p><Button variant="outline" onClick={onReset} className="mt-6 border-[#cad7e3] text-[#344960]"><RefreshCcw className="mr-2 h-4 w-4" />Run another demo</Button></div>;
  return <div className="flex h-full min-h-[440px] flex-col"><div className="flex items-center justify-between border-b border-[#e6ecf2] pb-3"><div className="flex items-center gap-2"><span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f7f5] text-[#0d6e6e]"><Bot className="h-4 w-4" /><span className="absolute -right-0.5 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#31aa9f]" /></span><div><p className="text-sm font-semibold">Asha · Admissions assistant</p><p className="text-xs text-[#6b7d92]">{activeLanguage} · browser speech enabled</p></div></div><Button variant="ghost" onClick={onReset} className="h-8 px-2 text-xs text-[#a24b3e] hover:bg-[#fff1ef] hover:text-[#8e3c30]"><PhoneOff className="mr-1.5 h-3.5 w-3.5" />End now</Button></div><div className="flex-1 space-y-4 overflow-y-auto py-5 pr-1">{transcript.map((item, index) => <div key={`${item.role}-${index}`} className={`flex ${item.role === "agent" ? "justify-start" : "justify-end"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === "agent" ? "rounded-tl-md bg-[#f0f7f6] text-[#183b3a]" : "rounded-tr-md bg-[#eaf0f8] text-[#18304c]"}`}><p>{item.content}</p>{item.source && <p className="mt-2 border-t border-[#cfe3df] pt-2 text-[10px] font-semibold tracking-[0.04em] text-[#377d77]">SOURCE · {item.source}</p>}{item.role === "agent" && <button onClick={() => speak(item.content, activeLanguage)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0d6e6e] hover:text-[#095d5d]"><Volume2 className="h-3 w-3" />Play audio</button>}</div></div>)}<div ref={transcriptEnd} /></div><div className="rounded-xl border border-[#dbe5ed] bg-[#fbfcfe] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs text-[#65768b]">Try questions about programmes, fees, eligibility, scholarships, admissions, a callback, or DNC.</span><Badge className={outcomeMeta[pendingOutcome].className}>{outcomeMeta[pendingOutcome].label}</Badge></div><form onSubmit={onSend} className="flex gap-2"><Textarea value={message} onChange={event => setMessage(event.target.value)} disabled={responding || callState === "finishing"} placeholder={activeLanguage === "Hindi" ? "छात्र का जवाब लिखें…" : "Type a student response…"} className="min-h-[42px] resize-none border-[#cfdbe7] bg-white text-sm" /><Button type="submit" disabled={responding || !message.trim() || callState === "finishing"} className="h-[42px] bg-[#0d6e6e] px-3 text-white hover:bg-[#095d5d]">{responding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></form><div className="mt-3 flex items-center justify-between gap-3"><button onClick={() => setMessage(activeLanguage === "Hindi" ? "फीस कितनी है?" : sampleQuestion)} className="text-xs font-medium text-[#0d6e6e] hover:underline">Use a sample question</button><Button onClick={onFinish} disabled={finishing || transcript.length < 2} variant="outline" className="h-8 border-[#c3d5d3] text-xs text-[#0d6e6e] hover:bg-[#effaf8]">{finishing && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Complete call<ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></div></div></div>;
}

function KnowledgeCard({ campaign }: { campaign: any }) { const knowledge = parseStoredJson<{ institution?: string; academicYear?: string; courses?: Array<{ name: string; duration: string; fee: string }>; sourceUrls?: string[] }>(campaign.knowledgeBase) ?? {}; const sourceUrls = knowledge.sourceUrls ?? []; return <div className="rounded-2xl border border-[#dce4ee] bg-white p-5"><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-[#0d6e6e]" /><h2 className="text-base font-semibold">College profile</h2></div><p className="mt-2 text-xs leading-5 text-[#64768b]">{knowledge.institution ?? "Approved profile"}{knowledge.academicYear ? ` · ${knowledge.academicYear}` : ""}</p><div className="mt-4 space-y-2">{knowledge.courses?.map(course => <div key={course.name} className="rounded-xl bg-[#f6f8fb] p-3"><p className="text-xs font-semibold text-[#263f57]">{course.name}</p><p className="mt-1 text-[11px] leading-4 text-[#687b90]">{course.duration}</p><p className="mt-1 text-[11px] font-medium leading-4 text-[#3e6272]">{course.fee}</p></div>)}</div>{sourceUrls.length > 0 && <div className="mt-4 border-t border-[#e6ecf2] pt-4"><p className="text-[10px] font-semibold tracking-[0.08em] text-[#6d7f94]">OFFICIAL SOURCES</p><div className="mt-2 space-y-1.5">{sourceUrls.map(url => <a key={url} href={url} target="_blank" rel="noreferrer" className="block truncate text-[11px] font-medium text-[#0d6e6e] hover:underline">{new URL(url).hostname}</a>)}</div></div>}</div>; }
function CallbackQueue({ callbacks, contacts }: { callbacks: any[]; contacts: any[] }) { return <div className="rounded-2xl border border-[#dce4ee] bg-white p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#4364a7]" /><h2 className="text-base font-semibold">Callback queue</h2></div><Badge className="bg-[#e9efff] text-[#4364a7] hover:bg-[#e9efff]">{callbacks.length}</Badge></div>{callbacks.length === 0 ? <p className="mt-5 text-xs leading-5 text-[#6a7b90]">No callbacks yet. A simulated request appears here when a student asks to speak to a counsellor.</p> : <div className="mt-4 space-y-2">{callbacks.slice(0, 3).map(callback => <div key={callback.id} className="rounded-xl bg-[#f6f8fb] p-3"><p className="text-xs font-semibold">{contacts.find(contact => contact.id === callback.contactId)?.fullName ?? "Contact"}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#687b90]">{callback.note}</p></div>)}</div>}</div>; }
function CallHistory({ records, contacts }: { records: any[]; contacts: any[] }) { if (records.length === 0) return <div className="flex min-h-48 flex-col items-center justify-center p-8 text-center"><ClipboardList className="h-7 w-7 text-[#91a1b3]" /><h3 className="mt-3 text-sm font-semibold">No simulation records yet</h3><p className="mt-1 text-xs text-[#6b7d92]">Complete a demo call to create the first traceable record.</p></div>; return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-[#fbfcfe] text-[11px] font-semibold tracking-[0.06em] text-[#6d7e92]"><tr><th className="px-5 py-3">CONTACT</th><th className="px-5 py-3">OUTCOME</th><th className="px-5 py-3">SUMMARY</th><th className="px-5 py-3">IST TIME</th></tr></thead><tbody>{records.slice(0, 8).map(record => <tr key={record.id} className="border-t border-[#e9eef3]"><td className="px-5 py-4 text-sm font-semibold">{contacts.find(contact => contact.id === record.contactId)?.fullName ?? "Synthetic contact"}</td><td className="px-5 py-4"><Badge className={outcomeMeta[record.outcome as Outcome].className}>{outcomeMeta[record.outcome as Outcome].label}</Badge></td><td className="max-w-sm px-5 py-4 text-xs leading-5 text-[#63758a]">{record.summary}</td><td className="px-5 py-4 text-xs text-[#63758a]">{toIst(record.createdAt)}</td></tr>)}</tbody></table></div>; }

function WorkflowPolicyView({ type, policy }: { type: "inbound" | "delegated"; policy: { label: string; permissions: string[]; blocks: string[] } | null }) { const Icon = type === "inbound" ? Headphones : ClipboardList; return <div className="mx-auto max-w-3xl rounded-2xl border border-[#dce4ee] bg-white p-7 sm:p-10"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9f4f4] text-[#0d6e6e]"><Icon className="h-6 w-6" /></div><h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em]">{policy?.label ?? "Workflow policy"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#617389]">The shared platform foundation is ready. This workflow has a distinct policy scope and is intentionally not wired to the outbound simulator.</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><div className="rounded-xl bg-[#f3faf8] p-5"><p className="text-xs font-semibold text-[#0d6e6e]">PERMITTED ACTIONS</p><ul className="mt-4 space-y-3">{policy?.permissions.map(item => <li key={item} className="flex gap-2 text-sm text-[#31515a]"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#16978b]" />{item}</li>)}</ul></div><div className="rounded-xl bg-[#fff6f4] p-5"><p className="text-xs font-semibold text-[#a64d41]">REQUIRES HUMAN REVIEW</p><ul className="mt-4 space-y-3">{policy?.blocks.map(item => <li key={item} className="flex gap-2 text-sm text-[#6a4e4a]"><AlertTriangle className="mt-0.5 h-4 w-4 text-[#c55a4b]" />{item}</li>)}</ul></div></div><div className="mt-7 rounded-xl border border-[#dce4ee] bg-[#fbfcfe] p-4 text-sm leading-6 text-[#607288]"><Info className="mr-2 inline h-4 w-4 text-[#4267a8]" />Build the policy and data foundation once; activate each live workflow only after its specific actions, data handling, and escalation rules are reviewed.</div></div>; }

function ContactsView({ contacts, records, addContact, bulkAdd, csvPreview, setCsvPreview, handleCsv, dialogOpen, setDialogOpen }: { contacts: any[]; records: any[]; addContact: any; bulkAdd: any; csvPreview: any[]; setCsvPreview: (value: any[]) => void; handleCsv: (event: ChangeEvent<HTMLInputElement>) => void; dialogOpen: boolean; setDialogOpen: (value: boolean) => void }) { const [form, setForm] = useState({ fullName: "", phoneNumber: "", language: "English" as "English" | "Hindi", consentSource: "", consentScope: "College information" }); const submit = async (event: FormEvent) => { event.preventDefault(); try { await addContact.mutateAsync(form); setForm({ fullName: "", phoneNumber: "", language: "English", consentSource: "", consentScope: "College information" }); setDialogOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Contact could not be added."); } }; const importCsv = async () => { try { await bulkAdd.mutateAsync(csvPreview); setCsvPreview([]); toast.success("CSV contacts added. All imported records include documented consent evidence."); } catch (error) { toast.error(error instanceof Error ? error.message : "CSV import could not be completed."); } }; return <><div className="flex flex-col justify-between gap-4 border-b border-[#dce4ee] pb-6 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold text-[#0d6e6e]">IST CONTACT DIRECTORY</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Contacts and consent ledger</h1><p className="mt-2 text-sm text-[#5d6f84]">The dialler reads this server-side ledger before every outbound simulation.</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-[#0d6e6e] text-white hover:bg-[#095d5d]"><Plus className="mr-2 h-4 w-4" />Add contact</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add a consented contact</DialogTitle><DialogDescription>For the live product, use only contacts with a clear, documented opt-in for this outreach purpose.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label="Student name"><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></Field><Field label="Phone number"><Input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} required /></Field><Field label="Language"><Select value={form.language} onValueChange={value => setForm({ ...form, language: value as "English" | "Hindi" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="English">English</SelectItem><SelectItem value="Hindi">Hindi</SelectItem></SelectContent></Select></Field><Field label="Opt-in source"><Input value={form.consentSource} onChange={e => setForm({ ...form, consentSource: e.target.value })} placeholder="e.g. Website enquiry form" required /></Field><Field label="Consent scope"><Input value={form.consentScope} onChange={e => setForm({ ...form, consentScope: e.target.value })} required /></Field><Button type="submit" disabled={addContact.isPending} className="w-full bg-[#0d6e6e] text-white hover:bg-[#095d5d]">{addContact.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save documented consent</Button></form></DialogContent></Dialog></div><section className="mt-7 grid gap-6 xl:grid-cols-[1fr_340px]"><div className="overflow-hidden rounded-2xl border border-[#dce4ee] bg-white"><div className="flex items-center justify-between border-b border-[#e6ecf2] p-5"><div><h2 className="text-lg font-semibold">Student contacts</h2><p className="mt-1 text-xs text-[#6b7d92]">{contacts.length} records · all contacts use IST</p></div><Badge className="bg-[#f1f8f7] text-[#0d6e6e] hover:bg-[#f1f8f7]"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Dialler checked</Badge></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#fbfcfe] text-[11px] font-semibold tracking-[0.06em] text-[#6d7e92]"><tr><th className="px-5 py-3">STUDENT</th><th className="px-5 py-3">LANGUAGE</th><th className="px-5 py-3">CONSENT</th><th className="px-5 py-3">DNC</th><th className="px-5 py-3">CALLS</th></tr></thead><tbody>{contacts.map(contact => <tr key={contact.id} className="border-t border-[#e9eef3]"><td className="px-5 py-4"><p className="text-sm font-semibold">{contact.fullName}</p><p className="mt-0.5 text-xs text-[#6b7d92]">{contact.phoneNumber} {contact.isSynthetic ? "· Synthetic" : ""}</p></td><td className="px-5 py-4 text-sm">{contact.language}</td><td className="px-5 py-4"><p className="text-xs font-semibold text-[#3c566f]">{contact.consentStatus === "opt_in" ? "Opted in" : contact.consentStatus}</p><p className="mt-0.5 text-[11px] text-[#77889a]">{contact.consentSource || "No evidence"}</p></td><td className="px-5 py-4">{contact.dnc ? <Badge className="bg-[#ffe9e6] text-[#a64435] hover:bg-[#ffe9e6]">Active DNC</Badge> : <span className="text-xs text-[#338178]">Clear</span>}</td><td className="px-5 py-4 text-sm tabular-nums">{records.filter(record => record.contactId === contact.id).length}</td></tr>)}</tbody></table></div></div><div className="rounded-2xl border border-[#dce4ee] bg-white p-5"><div className="flex items-center gap-2"><FileUp className="h-4 w-4 text-[#0d6e6e]" /><h2 className="text-base font-semibold">CSV import</h2></div><p className="mt-2 text-xs leading-5 text-[#687a8f]">Expected columns: <code>name, phone, language, consentSource, consentScope</code>. Contacts without consent evidence are rejected from this import.</p><label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#b8ccd9] bg-[#fbfcfe] px-4 py-6 text-center transition-colors hover:border-[#6fbeb7] hover:bg-[#f2fbfa]"><FileUp className="h-5 w-5 text-[#0d6e6e]" /><span className="mt-2 text-xs font-semibold text-[#315166]">Select a CSV file</span><input type="file" accept=".csv,text/csv" onChange={handleCsv} className="sr-only" /></label>{csvPreview.length > 0 && <div className="mt-4 rounded-xl bg-[#f2faf9] p-3"><p className="text-xs font-semibold text-[#0d6e6e]">{csvPreview.length} valid rows ready</p><p className="mt-1 text-[11px] leading-4 text-[#58786f]">Review occurs client-side before server import. Every row is recorded with documented consent evidence.</p><Button onClick={importCsv} disabled={bulkAdd.isPending} className="mt-3 w-full bg-[#0d6e6e] text-xs text-white hover:bg-[#095d5d]">{bulkAdd.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Import vetted rows</Button><button onClick={() => setCsvPreview([])} className="mt-3 w-full text-xs font-medium text-[#6a7b90] hover:text-[#334f66]">Discard preview</button></div>}</div></section></>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}</div>; }
function WorkspaceSkeleton() { return <div className="mx-auto max-w-[1440px] animate-pulse"><div className="h-7 w-72 rounded bg-[#dfe7ef]" /><div className="mt-3 h-4 w-[28rem] max-w-full rounded bg-[#e8eef4]" /><div className="mt-8 grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-2xl border border-[#dce4ee] bg-white" />)}</div><div className="mt-7 h-[420px] rounded-2xl border border-[#dce4ee] bg-white" /></div>; }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="mx-auto flex min-h-[70dvh] max-w-xl items-center"><div className="rounded-2xl border border-[#f3c7c1] bg-white p-8 text-center"><CircleAlert className="mx-auto h-8 w-8 text-[#b64e40]" /><h1 className="mt-4 text-xl font-semibold">Workspace unavailable</h1><p className="mt-2 text-sm leading-6 text-[#6c5e61]">{message}</p><Button onClick={onRetry} variant="outline" className="mt-6">Try again</Button></div></div>; }
