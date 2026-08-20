# Delhi College Source Notes

## University of Delhi Admissions 2026–27

- **Official source:** https://admission.uod.ac.in/
- The University of Delhi admissions portal presents UG CSAS 2026 registration and related admission schedules, notices, seat-matrix material, and a 2026–27 Bulletin of Information.
- This source will be used for University-level admission-process statements only. College-specific programmes, fees, and contact routes will be sourced separately from each college’s official domain.

## Lady Shri Ram College for Women

- **Official course page:** https://lsr.edu.in/admissions/courses-offered/
- **Official 2026–27 prospectus link:** https://lsr.edu.in/wp-content/uploads/2026/07/LSR-Admission-Prospectus-2026-27.pdf
- The official course page lists Honours study in Commerce, Economics, English, Hindi, History, Journalism, Mathematics, Philosophy, Political Science, Psychology, Sanskrit, Sociology, and Statistics; it states that Mathematics and Statistics are B.Sc. Honours, Commerce is B.Com. Honours, and the others are B.A. Honours. It also lists a B.A. Programme and B.El.Ed. and says B.El.Ed. admission is through CUET.
- The same page directs admissions queries for 2026 to `admission2026@lsr.edu.in`.
- Fee figures have not yet been normalized from the official 2026–27 prospectus; they must be extracted with their academic-year label before they are used in a spoken answer.

## Shri Ram College of Commerce

- **Official home:** https://www.srcc.edu/
- **Official UG admissions page:** https://www.srcc.edu/academics/admissions/admission-procedure/undergraduate
- SRCC’s official site identifies its location as University of Delhi North Campus, Maurice Nagar, Delhi. Its official 2026 undergraduate admissions page states that admission to all University of Delhi undergraduate programmes is based on CUET (UG) 2026 scores and directs candidates to the University’s BOI, CSAS, registration link, and schedule.
- The college site’s Courses navigation points to B.Com. (Hons.) and its official site describes Commerce, Economics, and Mathematics in its academic navigation. The final programme list used in an agent must be copied from the linked 2026 prospectus or course pages, not inferred from third-party summaries.
- The college’s own current fee table has not been found in the reviewed public pages. No fee number will be supplied in an agent answer until a college-authorized fee schedule is provided or located on an official page.

## Jesus and Mary College

- **Official fees page:** https://www.jmc.ac.in/admission/collegefees
- The college’s official page lists UG Admissions 2026–27, the University of Delhi Admission Bulletin 2026–27, and a 2026–27 seat-matrix/admission-fee document in its admissions navigation.
- The visible fee table is labeled **College Fees Structure 2025–26** and specifies that it is the first-year annual fee excluding examination fee. Examples listed by the college are ₹28,680 for B.A. (Hons) Economics, English, Hindi, History, Political Science, Sociology, B.Com (Hons), B.Com, and B.Sc (Hons) Mathematics; ₹29,180 for B.A. (Hons) Psychology; ₹37,070 for B.Voc Healthcare Management and B.Voc Retail Management and IT; and ₹33,730 for B.El.Ed.
- Because the fee table is explicitly for 2025–26, an outbound agent must state the academic year and offer a current admissions-team confirmation rather than treating it as a 2026–27 guarantee.

### JMC 2026–27 admission-fee document

- **Official document:** https://www.jmc.ac.in/uploads/admission/2026-27/JMC%20Seat%20Matrix%20and%20Admission%20fee%20for%20UG%20Admission%202026-27%20(23.06.26).pdf
- The official one-page document is titled as a JMC seat matrix and admission-fee document for UG Admission 2026–27. Its visible table confirms a 2026–27 source and lists the same programme family and fee values for its domestic fee column, including ₹28,680 for B.A. (Hons) Economics, English, Hindi, History, Political Science, Sociology, B.Com (Hons), B.Com, B.Sc (Hons) Mathematics, and many B.A. Programme combinations; ₹29,180 for Psychology; and ₹37,070 for its two B.Voc programmes. The document also includes seat totals and category columns.

### LSR 2026–27 prospectus

- **Official document:** https://lsr.edu.in/wp-content/uploads/2026/07/LSR-Admission-Prospectus-2026-27.pdf
- The prospectus is published from the official LSR domain. Its PDF viewer did not render readable document text in the browser session, so no fee or eligibility number has been added from it. The implementation will either use the official webpage details already verified or wait for text extraction from the official PDF rather than guessing.

### SRCC course-page verification

- **Official course page:** https://www.srcc.edu/academics/courses/bcomh
- The official page title identifies B.Com. (Hons.) but its course detail is currently marked “Page Under Revision.” The profile therefore uses the 2026 admissions page for the official University of Delhi admission process and limits programme claims to the clearly named B.Com. (Hons.) page and the college’s directly stated admissions information.

## Production Telephony Source Note

- **Official Exotel API reference:** https://developer.exotel.com/docs/voice-v1/api-reference/connect-two-numbers
- Exotel’s documented Connect Two Numbers endpoint uses a Mumbai regional endpoint, accepts `From`, `To`, and an ExoPhone caller ID, and documents E.164 contact format. Its reference includes status callbacks, call recording controls, and a WebSocket `StreamUrl` for real-time audio streaming. The production architecture can use the callback and streaming options, but credentials and account/number provisioning are required before any real integration.

## Real-Time Agent Runtime Source Note

- **Official LiveKit telephony documentation:** https://docs.livekit.io/telephony/
- LiveKit documents inbound and outbound AI telephony using SIP participants, trunks, and dispatch rules. It says outbound calls use an explicitly created SIP participant and that trunks bridge a third-party SIP provider with LiveKit.
- Its compatibility list includes Exotel and Plivo among tested SIP providers. This makes an Exotel/LiveKit design a technically documented option: Exotel provides India-facing telephony and LiveKit provides the real-time voice-agent session layer. LiveKit’s own managed phone-number offering is described as United States local/toll-free, so it is not a substitute for an India telephony provider in this use case.
