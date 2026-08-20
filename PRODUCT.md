# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a college admissions or outreach operator in India. They need to prepare consent-controlled student-engagement campaigns, review simulated conversations, manage callback requests, and maintain clear audit records before connecting any live calling provider.

## Product Purpose

India Voice Agent Control Center is an internal platform for three distinct voice-agent workflows: outbound student engagement, inbound support, and supervised delegated tasks. The current release is a browser-only outbound simulation that introduces a college, asks whether a student is interested, answers questions strictly from approved content, and captures a safe next step.

## Positioning

The product combines a polished calling-operations console with enforcement rather than merely displaying policies: consent, do-not-call status, IST call windows, AI disclosure, approved-content boundaries, and fixed outcomes are evaluated server-side before simulation responses are produced.

## Operating Context

Operators work in an internal web dashboard. They manage contacts, consent evidence, campaign policies, approved course and fee knowledge, simulations, transcripts, outcomes, callback requests, and operational alerts. The initial demonstration has no public telephony and uses only clearly labeled synthetic data.

## Capabilities and Constraints

- The shared platform includes Outbound, Inbound Support, and Delegated Task workflow areas with independent permissions and policy controls.
- The demonstration builds only the outbound student-information flow end to end.
- Every contact timezone is IST and language choices are Hindi or English.
- Outbound activity is limited to 9am–9pm IST.
- A hard-coded disclosure identifies the agent as AI at the beginning of every simulated call.
- The conversation service may only respond from the selected campaign’s approved knowledge base and script. It must transfer or use a safe fallback rather than invent a claim.
- Dialer-level consent and do-not-call checks prevent ineligible simulation attempts; the user interface alone cannot override them.
- Permitted outcomes are exactly: interested, callback, not interested, and DNC.
- High-priority callback, DNC, and simulation-error outcomes notify the project owner.
- The fictional college, programme, fee, scholarship, eligibility, FAQ, campaign, and student records are synthetic sample content for the browser demo only. They must never be represented as real client data or institutional facts.
- The operator will supply real client content and contacts after evaluating the demo.

## Brand Commitments

The product must feel elegant, refined, professional, and trustworthy. It is an internal operations interface, so clarity, safety visibility, scanability, and thoughtful interaction feedback take priority over decorative effects.

## Evidence on Hand

The current project is a fresh Manus full-stack web application with authentication, database support, server-side LLM access, owner notifications, and reusable dashboard components. No real brand assets, client data, customer reviews, testimonials, or real college facts have been provided; these must not be fabricated.

## Product Principles

1. Enforce critical calling safeguards in backend logic, not only through UI guidance.
2. Make every automated action explainable through policy visibility and an audit record.
3. Keep each voice-agent workflow isolated by permissions, knowledge, and allowed actions.
4. Treat natural conversation as helpful, concise, and transparent rather than deceptive.
5. Make the transition from synthetic demo to real client deployment deliberate and reviewable.

## Accessibility & Inclusion

The interface must be keyboard reachable, readable at common zoom levels, responsive for mobile operators, and explicit about error, loading, empty, and restricted states. English and Hindi are supported contact preferences; the current interface language remains English unless later localized.
