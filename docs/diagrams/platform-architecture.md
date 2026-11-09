# Implemented platform architecture

Updated 9 November 2026. [Standalone SVG](platform-architecture.svg) ·
[Full explanation](../architecture.md). Arrows show implemented data paths;
Notification Hub is outside them.

```mermaid
flowchart TB
    H["Firebase Hosting<br/>React + TypeScript + Vite assets"] --> B["Browser<br/>Student · Organizer · Admin<br/>QR rendered and decoded locally"]
    B <-->|"Google sign-in / Firebase ID token"| A["Firebase Authentication<br/>Google identity"]
    B <-->|"HTTPS REST / ID token"| API["Render · persistent Node / Express API<br/>Verified identity · roles · ownership · validation"]
    API -->|"Verify token / revocation"| A
    API <-->|"Admin SDK / transactions"| DB[("Cloud Firestore<br/>Profiles · activities · registrations · attendance<br/>Requests · audit · retry / deduplication state")]
    API <-->|"Bounded task text / validated output"| AI["AI/ML API<br/>Planning · Organizer rubric<br/>Library relevance / query"]
    API -->|"Explicit reviewed facilities POST"| M["Team 10 Maintenance<br/>Work orders / staff workflow"]
    M -->|"Signed raw-body webhook<br/>Deduplication / monotonic versions"| API
    API <-->|"Read-only catalog GET<br/>No Student identity"| L["Library<br/>Books / copy counts / links"]
    API <-->|"Read-only public feed GET<br/>No Student identity"| I["Team 17 Internship<br/>Demo-labelled listings / links"]
    API --- W["In-process integration worker<br/>Legacy durable retries when enabled<br/>Publication / polling currently disabled"]
    N["Notification Hub<br/>Coordination attempted<br/>No active integration"]
    classDef client fill:#eff6ff,stroke:#2563eb,color:#172554
    classDef server fill:#172554,stroke:#2563eb,color:#ffffff
    classDef data fill:#ecfdf5,stroke:#059669,color:#064e3b
    classDef partner fill:#f8fafc,stroke:#64748b,color:#0f172a
    classDef pending fill:#fffbeb,stroke:#d97706,color:#78350f,stroke-dasharray:5 5
    class H,B,A client
    class API server
    class DB data
    class AI,M,L,I,W partner
    class N pending
```

No browser-to-Firestore data path exists. Client rules deny access; server
authorization protects Admin SDK operations. Partner/AI keys stay server-only.
Admin has no event CRUD, roster or check-in powers. The worker is persistent;
it does not auto-send saved facilities notes. Render idle sleep limits availability.

Partner completion is user-confirmed on 9 November, not new captured execution
evidence. Maintenance is the main showcase; Library/Internship are read-only;
Notification Hub remains an attempted connection.
