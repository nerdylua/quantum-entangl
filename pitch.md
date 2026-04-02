# Phase 1 Pitch: Quantum-Secured Online Joint Consultation

## 1) Why this project is necessary
Online joint consultations (multi-doctor case discussions, remote diagnostics, specialist referrals) exchange highly sensitive data in real time.  
The core problem is not only encryption, but trust in long-term confidentiality and session integrity:

- Medical data must remain private for years.
- Classical key exchange is vulnerable to future quantum attacks (harvest-now, decrypt-later).
- Multi-party sessions are exposed to man-in-the-middle risks during key setup.
- Not all participants can own full quantum hardware.

This creates a strong need for a **practical, multi-party, quantum-secure key agreement system** where weaker users can still participate safely.

## 2) Why quantum, specifically
Quantum security is different from classical security:

- Classical cryptography is mostly **computationally secure** (hard to break).
- QKD is **physics-secure** (measurement disturbs quantum states).
- Eavesdropping becomes observable through **QBER (Quantum Bit Error Rate)**.

So quantum does not just encrypt better; it can actively reveal interception attempts.

## 3) Why we chose this paper
We selected **“Three-Party Controlled Authentication Semiquantum Key Agreement Protocol for Online Joint Consultation”** because it directly matches our use case:

- It is designed for online joint consultation settings.
- It supports semiquantum users with limited capabilities.
- It introduces a trusted controller for stronger authentication.
- It combines identity authentication + fair shared key agreement.

This makes it academically aligned and implementation-friendly for a course project.

## 4) What we learned from the paper

- A **controller-assisted semiquantum model** is practical for real deployments.
- Authentication must be built into key agreement, not treated as a separate afterthought.
- Multi-party entanglement and retransmission strategies can reduce participant hardware burden.
- Security evaluation must include both external attacks and insider manipulation.

The key takeaway: for healthcare-like collaboration, **secure key agreement + participant authentication + low device requirements** should be designed together.

## 5) Our project idea (Phase 1 proposal)
We propose a quantum-secured communication platform for joint consultation rooms, where keys are generated via QKD and used for encrypted messaging/file sharing.

### QKD protocols in scope

- **BB84** (prepare-and-measure, fast baseline)
- **Bell State / T22** (entanglement + fidelity-based matching)
- **E91** (entanglement + anti-correlation model)
- **GHZ** for 3+ members (multi-party key agreement)

### Math core (compact)

- BB84 states: `|0⟩, |1⟩, |+⟩ = (|0⟩ + |1⟩)/√2, |−⟩ = (|0⟩ − |1⟩)/√2`
- Bell states:
  - `|Φ+⟩ = (|00⟩ + |11⟩)/√2`
  - `|Φ−⟩ = (|00⟩ − |11⟩)/√2`
  - `|Ψ+⟩ = (|01⟩ + |10⟩)/√2`
  - `|Ψ−⟩ = (|01⟩ − |10⟩)/√2`
- E91 singlet: `|ψ−⟩ = (|01⟩ − |10⟩)/√2` with anti-correlated outcomes
- GHZ (N-party): `|GHZ_N⟩ = (|00...0⟩ + |11...1⟩)/√2`
- QBER: `QBER = errors / compared_bits`

### Key generation and compromise logic

- Target key length: **256 bits**
- Iterative rounds continue until enough sifted bits are collected.
- Protocol thresholds in our design:
  - BB84: 8%
  - E91: 8%
  - GHZ: 8%
  - Bell State: 15%
- If QBER exceeds threshold, key is rejected and channel is marked compromised.
- Rekeying is triggered to restore a clean secure channel.

## 6) How we simulate real quantum networks

- Quantum circuits are built using **Qiskit** and run on **Aer `qasm_simulator`**.
- We model basis choices, measurement, sifting, and eavesdropper intercept-resend behavior.
- We inject an Eve toggle to observe QBER spikes in real time.
- We treat protocol selection as topology-aware:
  - 2-party rooms: BB84/Bell/E91
  - 3+ party rooms: GHZ auto-selection

This gives a realistic protocol-level simulation while remaining deployable in a software-only environment.

## 7) Communication and security architecture

- **WebSockets (Socket.IO)** for real-time room events and key lifecycle events.
- Server orchestrates QKD rounds and distributes keys only after acceptance.
- Per user, the session key is wrapped with **RSA-2048 OAEP (SHA-256)**.
- Chat and file payloads use **AES-256-CTR** with per-message nonce.

Security comes from two layers:

- **Physics layer:** no-cloning + measurement disturbance -> eavesdropper detection via QBER.
- **Systems layer:** modern cryptographic transport and symmetric encryption for application data.

## 8) Why this is secure (physics intuition)

- Unknown quantum states cannot be perfectly copied (no-cloning theorem).
- Measuring in the wrong basis introduces disturbance.
- Disturbance statistically appears as elevated QBER.
- Therefore, passive interception is not silent; it leaves measurable traces.

This is the core reason QKD is attractive for high-stakes consultation data.

## 9) Practical uses of this project

- Multi-hospital case discussion and telemedicine
- Financial multi-party approvals/settlements
- Legal/IP sharing among multiple stakeholders
- Government/critical-infrastructure coordination channels

## 10) Planned tech stack

- **Frontend:** Next.js, React, TypeScript, Zustand, Socket.IO client
- **Backend:** FastAPI, python-socketio, asyncio
- **Quantum:** Qiskit, Qiskit Aer (`qasm_simulator`), NumPy
- **Crypto:** cryptography (Python RSA-OAEP), node-forge (browser RSA), AES-CTR

## 11) Phase 1 scope statement
Phase 1 establishes the research-backed solution design:

- Problem framing and threat model
- Paper justification
- Protocol and math mapping
- End-to-end architecture and security flow
- Implementation roadmap for later phases

In later phases, we implement full controller-assisted authentication flow inspired by the selected semiquantum protocol and evaluate performance/security experimentally across protocols.
