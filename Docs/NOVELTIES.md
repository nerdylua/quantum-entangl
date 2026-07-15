# Novelties & Real-World Applications

What makes Entangl unique and where quantum-secured communication matters.

---

## What Makes This Project Novel

### 1. Live Eavesdropper Detection — Not Just Encryption

Most secure chat apps (Signal, WhatsApp) rely on mathematical hardness assumptions. Entangl demonstrates something fundamentally different: **physics-based intrusion detection**. Toggle Eve on, and you *watch* the QBER spike in real time — proving that measuring a quantum state disturbs it. No classical system can do this.

### 2. Four QKD Protocols Side-by-Side

No other demo application implements BB84, Bell State T22, E91, and GHZ in the same codebase with a live comparison dashboard. Users can switch protocols per room and compare QBER, speed, and error rates on real Qiskit-simulated circuits — not animations or mockups.

### 3. Multi-Party Quantum Key Agreement (GHZ)

Most QKD demos are strictly two-party. Entangl auto-selects the GHZ protocol for 3+ member rooms, distributing a shared key across N parties using genuinely entangled N-qubit states. This is directly relevant to group consultations, board meetings, and multi-site coordination.

### 4. Three-Layer Hybrid Cryptosystem

```
Quantum (QKD)  →  generates 256-bit key
Classical (RSA-2048 OAEP)  →  transports key per-member
Symmetric (AES-256-CTR)  →  encrypts every message
```

This mirrors real-world quantum-safe architecture: QKD for key generation, PKI for distribution, symmetric cipher for bulk data. The server never sees plaintext or symmetric keys.

### 5. Real Quantum Circuits, Not Toy Examples

Each protocol constructs actual quantum circuits (Hadamard, CNOT, Pauli gates, T-gates), transpiles them via Qiskit, and runs them on `qasm_simulator`. The QBER values are measured from real simulation output — not hardcoded or randomized.

---

## Real-World Use Cases

### Healthcare & Medical Imaging (DICOM)

**The problem:** DICOM images (MRI, CT, X-ray) transferred between hospitals use TLS with RSA/ECDH key exchange. A patient's scan taken today may be sensitive for 30+ years — well within the timeline of cryptographically relevant quantum computers.

**How Entangl's architecture applies:**

| Current DICOM Security | Entangl's QKD Approach |
|------------------------|----------------------|
| RSA key exchange (breakable by Shor's algorithm) | QKD-generated keys (information-theoretic security) |
| Passive interception is undetectable | Any interception raises QBER → detected and blocked |
| Security relies on computational hardness | Security relies on laws of physics |
| No forward indication of compromise | Real-time QBER monitoring alerts before compromised keys are used |

**Specific scenarios:**
- **Radiology transfers** — Hospital A sends DICOM studies to Hospital B for specialist review. QKD on the inter-hospital fiber link ensures the images can't be harvested for future decryption.
- **Telemedicine** — Radiologist reading from a remote site over metro-area fiber (~100 km, within QKD range). Patient data is protected by physics, not just math.
- **Multi-site tumor boards** — 3+ hospitals discuss a case with shared imaging. GHZ multi-party protocol distributes a single shared key to all sites simultaneously.

**Regulatory alignment:**
- **HIPAA** (45 CFR 164.312) — QKD provides access controls + audit trail (QBER logs = proof of channel integrity)
- **GDPR Article 32** — "State of the art" security; QKD exceeds classical encryption standards
- **NIST SP 800-175B** — Recommends defense-in-depth; QKD + AES-256 satisfies this layered approach

---

### Finance & Banking

**The problem:** Inter-bank settlement messages (SWIFT, ISO 20022) and trading data are high-value targets. Adversaries recording today's RSA-encrypted traffic can decrypt it once quantum computers mature.

**How Entangl's architecture applies:**
- **Inter-bank links** — Point-to-point QKD over dark fiber between data centers (metro distances). Symmetric keys feed AES encryptors at line rate.
- **Multi-party settlements** — GHZ protocol for 3+ bank clearing operations where all parties need the same key simultaneously.
- **Continuous monitoring** — QBER dashboard concept translates to real-time channel integrity verification for compliance (PCI-DSS, SEC, FCA requirements).

---

### Military & Government

**The problem:** Classified communications have 25–75+ year sensitivity windows. Nation-state adversaries are the most likely to build early quantum computers.

**How Entangl's architecture applies:**
- **Diplomatic channels** — Embassy-to-capital QKD links where host-nation wiretapping is the threat model. Eavesdropper detection alerts before keys are compromised.
- **Multi-party command** — GHZ protocol for joint operations where 3+ command centers need synchronized secure communication.
- **NSA CNSA 2.0** mandates quantum-resistant algorithms for National Security Systems by 2033–2035. QKD provides an additional non-computational security layer on top of PQC.

---

### Critical Infrastructure (SCADA / Smart Grid)

**The problem:** Power grid control signals between substations use legacy protocols with weak encryption. A compromised command can cause physical damage.

**How Entangl's architecture applies:**
- **Substation-to-control-center** — Utilities own dark fiber between substations (typically 10–80 km). QKD devices on this fiber secure SCADA commands with provable security.
- **QBER as early warning** — Critical infrastructure attacks involve months of reconnaissance. Real-time eavesdropping detection on backbone links reveals the recon phase before the attack.
- **NERC CIP compliance** — CIP-005/007/012 require encrypted inter-control-center communications. QKD provides a provably secure key source.

---

### Supply Chain & Legal

- **Contract negotiations** — Multi-party rooms with GHZ ensure all parties share the same quantum-secured channel. Encryption logs provide an audit trail.
- **IP transfers** — Patent filings, trade secrets, and M&A documents transferred between law firms and clients with eavesdropper detection as proof of secure delivery.
- **Chain of custody** — File sharing with read receipts + encryption logs = verifiable record that a specific document was securely delivered and read.

---

## The "Harvest Now, Decrypt Later" Threat

This is the most urgent reason QKD matters **today**, not in the future.

**The attack:** Adversaries (primarily nation-states) record encrypted traffic now — storing ciphertext protected by RSA/ECDH. When quantum computers arrive (estimated 2030–2045), they retroactively decrypt everything.

**Why this is real:**
- Storage is cheap: bulk recording costs far less than real-time decryption
- RSA-2048 falls to ~4,000 logical qubits via Shor's algorithm
- Data categories with decades-long sensitivity: health records, state secrets, financial positions, source identities

**Why QKD is the strongest countermeasure:**

| Approach | HNDL Protection | Guarantee Type |
|----------|----------------|---------------|
| Classical (RSA/ECC) | None — vulnerable by definition | Computational (breakable) |
| Post-Quantum Crypto (ML-KEM) | Strong against known attacks | Computational (unproven long-term) |
| **QKD** | **Complete — even recorded traffic is safe** | **Information-theoretic (physics)** |

QKD-generated keys cannot be reconstructed from recorded quantum channel data. This is not a computational assumption — it's a consequence of the no-cloning theorem and Heisenberg uncertainty. Even with infinite compute power, the key is safe.

---

## Demo Talking Points

When presenting Entangl, these are the key moments:

1. **"Watch the QBER"** — Create a room, let key exchange complete (QBER near 0%). Then toggle Eve and rekey. The gauge jumps, the key is rejected, the banner turns red. *"That's quantum physics detecting an eavesdropper in real time."*

2. **"Compare protocols"** — Create rooms with different protocols. Show the Protocol Compare charts. *"BB84 is fastest at 0.9s, GHZ handles 3+ parties, Bell State tolerates 15% noise."*

3. **"The server knows nothing"** — Show the encryption logs. *"RSA keys generated in your browser. AES encryption happens client-side. The server relays ciphertext it can't read."*

4. **"Future-proof"** — *"Even if someone recorded this entire session, a quantum computer can't retroactively break QKD-generated keys. That's the difference between computational and information-theoretic security."*

5. **"Healthcare scenario"** — *"Replace 'chat message' with 'DICOM image' and 'room members' with 'hospitals'. Same architecture, same eavesdropper detection, same physics-based guarantee. A patient's MRI is safe for 30 years, not just until quantum computers arrive."*

---

## Existing Real-World QKD Deployments

| Deployment | Year | Details |
|-----------|------|---------|
| **China: Beijing-Shanghai Backbone** | 2017 | 2,000 km fiber, 32 trusted nodes. Used by ICBC and government agencies. Now 4,600+ km. |
| **China: Micius Satellite** | 2016 | LEO satellite QKD. Demonstrated Beijing-Vienna intercontinental key exchange (7,600 km). |
| **Switzerland: Geneva Elections** | 2007 | id Quantique QKD secured ballot transmission. One of the earliest non-research deployments. |
| **USA: DARPA Quantum Network** | 2004 | First QKD network (10 nodes, Boston metro). BBN/Harvard/BU. |
| **South Korea: SK Telecom** | 2016 | QKD on backbone between Seoul data centers, integrated with 5G infrastructure. |
| **UK: BT/Toshiba Cambridge** | 2022 | Commercial QKD co-existing with classical data on same fiber (DWDM multiplexing). |
| **EU: EuroQCI** | 2019 | All 27 EU member states. Pan-European QKD network via fiber + IRIS2 satellites by ~2030. |
| **Japan: Tokyo QKD Network** | 2010 | NICT testbed. Demonstrated QKD-secured genome data transfer. |

These deployments validate that Entangl's architecture — QKD key generation + classical key transport + symmetric encryption — is the real-world pattern, not an academic exercise.
