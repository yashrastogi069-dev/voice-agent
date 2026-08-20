# Browser Demo Guide

## Purpose

This workspace is a **browser-only college outreach demonstration**. It does not place real telephone calls. The fictional college, student contacts, programmes, fee figures, and conversations are synthetic test material.

## How to Run the Demo

Sign in to the private workspace, then load the synthetic demo. Approve the fictional campaign, select a synthetic contact, and start the demo from the Outbound workspace. Type student-style questions such as “What are the BCA fees?”, “What are the eligibility requirements?”, or “Please arrange a callback.” The agent speaks replies through the browser’s speech capability where it is available.

When the conversation is complete, select **Complete call**. The workspace records the fixed outcome and stores the summary in the simulation record. The contacts screen supports manual entries and a CSV preview for later use with real, permissioned contact data.

## Test Presentation

The test interface deliberately omits visible policy panels and a disclosure phrase in its opening conversation, as requested. The presentation is suitable only for this isolated browser simulation.

## Before Any Real Calling

Do not connect this test workspace to real phone numbers without replacing all fictional content, validating recipient consent and opt-out handling, adding a suitable identity/disclosure flow, configuring a compliant telephony provider, and reviewing the applicable requirements for the intended calling programme. The existing backend checks for consent, do-not-call status, campaign approval, call frequency, and the IST calling window remain in place.

## Verification Notes

TypeScript checks and the automated policy suite pass. The protected sign-in page was verified at desktop and mobile sizes. The authenticated dashboard should be reviewed in the project preview after sign-in, because the automated preview session does not carry the owner’s login state.
