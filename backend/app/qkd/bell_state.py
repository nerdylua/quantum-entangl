"""
Bell State (T22) QKD Protocol - Ported to Qiskit 1.0+ API.

Alice creates 4-qubit circuits with random pairings and group codes (Bell state pairs).
Bob applies reverse circuits with his own random pairings and group codes.
If Bob's match Alice's, measurement yields |0000> (correct guess) -> contributes 2 key bits.
Key is extracted from the group codes of correct guesses.

QBER is fidelity-based: measures the fraction of shots yielding |0000⟩ for matched trials.
Eavesdropper degrades fidelity from ~1.0 to ~0.22, causing detection.

Optimized: All trial circuits are batch-transpiled and run in a single call.
"""

import random
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
from qiskit_aer import Aer

NUM_QUBITS = 4
backend = Aer.get_backend("qasm_simulator")


class Pairing:
    def __init__(self, pair1, pair2):
        self.bit0 = pair1[0]
        self.bit1 = pair1[1]
        self.bit2 = pair2[0]
        self.bit3 = pair2[1]


# --- Bell State creation ---

def phi_plus(bit0, bit1, qc):
    qc.h(bit0)
    qc.cx(bit0, bit1)

def phi_minus(bit0, bit1, qc):
    qc.x(bit0)
    qc.h(bit0)
    qc.cx(bit0, bit1)

def psi_plus(bit0, bit1, qc):
    qc.h(bit0)
    qc.x(bit1)
    qc.cx(bit0, bit1)

def psi_minus(bit0, bit1, qc):
    qc.h(bit0)
    qc.x(bit1)
    qc.z(bit0)
    qc.z(bit1)
    qc.cx(bit0, bit1)


# --- Bell State reversal ---

def phi_plus_reverse(bit0, bit1, qc):
    qc.cx(bit0, bit1)
    qc.h(bit0)

def phi_minus_reverse(bit0, bit1, qc):
    qc.cx(bit0, bit1)
    qc.h(bit0)
    qc.x(bit0)

def psi_plus_reverse(bit0, bit1, qc):
    qc.cx(bit0, bit1)
    qc.x(bit1)
    qc.h(bit0)

def psi_minus_reverse(bit0, bit1, qc):
    qc.cx(bit0, bit1)
    qc.z(bit1)
    qc.z(bit0)
    qc.x(bit1)
    qc.h(bit0)


# --- Circuit builders (Alice) ---

BELL_PAIRS = [
    (phi_plus, phi_minus),   # group 00
    (phi_minus, phi_plus),   # group 01
    (psi_plus, psi_minus),   # group 10
    (psi_minus, psi_plus),   # group 11
]

def circuit_group(group_code, pairs):
    """Build Alice's entangling circuit for a given group code (0-3)."""
    q = QuantumRegister(NUM_QUBITS)
    b = ClassicalRegister(NUM_QUBITS)
    qc = QuantumCircuit(q, b)

    first, second = BELL_PAIRS[group_code]
    first(q[pairs.bit0], q[pairs.bit1], qc)
    second(q[pairs.bit2], q[pairs.bit3], qc)

    return qc, q


# --- Reverse circuit builders (Bob) ---

REVERSE_MAP = [
    (phi_plus_reverse, phi_minus_reverse),   # group 00
    (phi_minus_reverse, phi_plus_reverse),   # group 01
    (psi_plus_reverse, psi_minus_reverse),   # group 10
    (psi_minus_reverse, psi_plus_reverse),   # group 11
]

def reverse_circuit_group(group_code, pairs, q, qc):
    """Apply Bob's reversal circuit for a given group code."""
    first, second = REVERSE_MAP[group_code]
    first(q[pairs.bit0], q[pairs.bit1], qc)
    second(q[pairs.bit2], q[pairs.bit3], qc)


ALL_PAIRINGS = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]


def _grouping_to_bits(grouping: int) -> str:
    return f"{grouping:02b}"


def generate_round(round_size: int = 64, eavesdropper: bool = False):
    """
    Run one round of the T22 Bell State QKD protocol.

    All trial circuits are batch-transpiled and executed in a single call
    for performance (avoids per-trial transpile+run overhead).

    Returns:
        (key_bits: str, qber: float)
    """
    alice_pairings = [random.choice(ALL_PAIRINGS) for _ in range(round_size)]
    alice_groupings = [random.randint(0, 3) for _ in range(round_size)]
    bob_pairings = [random.choice(ALL_PAIRINGS) for _ in range(round_size)]
    bob_groupings = [random.randint(0, 3) for _ in range(round_size)]

    # Build all trial circuits with measurements baked in
    circuits = []
    for i in range(round_size):
        a_pairs = Pairing(alice_pairings[i][0], alice_pairings[i][1])
        qc, q = circuit_group(alice_groupings[i], a_pairs)

        if eavesdropper:
            eve_cr = ClassicalRegister(NUM_QUBITS, "eve")
            qc.add_register(eve_cr)
            eve_qubits = random.sample(range(NUM_QUBITS), random.randint(1, NUM_QUBITS))
            for eq in eve_qubits:
                qc.measure(q[eq], eve_cr[eq])
            qc.barrier()

        b_pairs = Pairing(bob_pairings[i][0], bob_pairings[i][1])
        reverse_circuit_group(bob_groupings[i], b_pairs, q, qc)

        # Measure into the main classical register (cregs[0] = b)
        for j in range(NUM_QUBITS):
            qc.measure(j, j)

        circuits.append(qc)

    # Batch transpile and run all circuits at once
    try:
        transpiled = transpile(circuits, backend, optimization_level=0)
        job = backend.run(transpiled, shots=32)
        result = job.result()
    except Exception as e:
        print(f"Bell State batch execution error: {e}")
        return "", 0.0

    # Evaluate each trial's |0000⟩ fidelity
    correct_guesses = []
    fidelities = []

    for i in range(round_size):
        try:
            counts = result.get_counts(i)
        except Exception:
            continue

        zero_count = 0
        total_shots = sum(counts.values())
        for state_str, count in counts.items():
            # Main register (cregs[0]) is the rightmost group in the result string
            main_bits = state_str.split()[-1]
            if main_bits == "0" * NUM_QUBITS:
                zero_count += count

        fidelity = zero_count / total_shots if total_shots > 0 else 0.0

        # Threshold 0.5 cleanly separates exact matches (fidelity ≈ 1.0)
        # from non-matches (~0.0 or ~0.25) and Eve-degraded matches (~0.22).
        if fidelity > 0.5:
            correct_guesses.append(i)
            fidelities.append(fidelity)

    # QBER from the quality of matched trials (fidelity-based).
    # Without Eve: fidelity ≈ 1.0 → QBER ≈ 0
    # With Eve: fidelity drops to ~0.22 → all fail 0.5 threshold → QBER = 1.0
    if fidelities:
        avg_fidelity = sum(fidelities) / len(fidelities)
        qber = 1.0 - avg_fidelity
    else:
        qber = 1.0

    # Extract key bits from correct guesses using Alice's group codes
    key = "".join(_grouping_to_bits(alice_groupings[idx]) for idx in correct_guesses)

    return key, qber
