"""
E91 QKD Protocol - Optimized for Qiskit 1.0+ API.

Creates entangled singlet states and measures in different bases.
Alice measures in 3 bases (A1=X, A2=W, A3=Z); Bob in 3 bases (B1=W, B2=Z, B3=V).
Key extracted when basis combos align (A2B1 or A3B2).
Singlet state produces ANTI-correlated results: matching bits indicate errors.
QBER from correlated results in key-contributing basis pairs (should be anti-correlated).

Optimized: Circuits grouped by basis combination with multi-shot execution.
"""

import random
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer

backend = Aer.get_backend("qasm_simulator")


def _build_circuit(a_choice: int, b_choice: int, eavesdropper: bool) -> QuantumCircuit:
    """Build a single E91 circuit for a given Alice/Bob basis combination."""
    qc = QuantumCircuit(2, 2)

    # Create singlet state |ψ⁻⟩ = (|01⟩ - |10⟩)/√2
    qc.x(0)
    qc.x(1)
    qc.h(0)
    qc.cx(0, 1)

    # Alice's measurement basis (qubit 0)
    if a_choice == 1:  # A1: X basis
        qc.h(0)
    elif a_choice == 2:  # A2: W basis (π/8 rotated)
        qc.s(0)
        qc.h(0)
        qc.t(0)
        qc.h(0)
    # A3: Z basis - no gates needed

    # Eavesdropper intercept-resend on Bob's qubit
    if eavesdropper:
        eve_basis = random.randint(0, 1)
        if eve_basis == 1:
            qc.h(1)
        qc.measure(1, 1)
        if eve_basis == 1:
            qc.h(1)
        qc.barrier()

    # Bob's measurement basis (qubit 1)
    if b_choice == 1:  # B1: W basis
        qc.s(1)
        qc.h(1)
        qc.t(1)
        qc.h(1)
    elif b_choice == 3:  # B3: V basis (−π/8 rotated)
        qc.s(1)
        qc.h(1)
        qc.tdg(1)
        qc.h(1)
    # B2: Z basis - no gates needed

    qc.measure(0, 0)
    qc.measure(1, 1)
    return qc


def generate_round(round_size: int = 128, eavesdropper: bool = False):
    """
    Run one round of the E91 QKD protocol.

    Optimized: groups trials by (Alice basis, Bob basis) combination and
    runs each group as a single multi-shot circuit instead of round_size
    individual circuits. At most 9 circuits instead of round_size.

    Returns:
        (key_bits: str, qber: float)
    """
    num_singlets = round_size

    # Random basis choices for Alice (1-3) and Bob (1-3)
    alice_choices = [random.randint(1, 3) for _ in range(num_singlets)]
    bob_choices = [random.randint(1, 3) for _ in range(num_singlets)]

    # Group trials by basis combination for efficient batch execution
    combo_counts = {}  # (a_choice, b_choice) -> shot count
    for i in range(num_singlets):
        combo = (alice_choices[i], bob_choices[i])
        combo_counts[combo] = combo_counts.get(combo, 0) + 1

    # Build one circuit per unique combo, run with appropriate shots
    combo_results = {}  # (a_choice, b_choice) -> {outcome_str: count}

    for (a_choice, b_choice), shots in combo_counts.items():
        qc = _build_circuit(a_choice, b_choice, eavesdropper)
        try:
            transpiled = transpile(qc, backend, optimization_level=0)
            job = backend.run(transpiled, shots=shots)
            counts = job.result().get_counts()
            combo_results[(a_choice, b_choice)] = counts
        except Exception as e:
            print(f"E91 circuit error for combo ({a_choice},{b_choice}): {e}")
            combo_results[(a_choice, b_choice)] = {}

    # Extract key from matching basis pairs (A2B1 or A3B2)
    key_bits = []
    total_compared = 0
    mismatches = 0

    for (a_choice, b_choice), counts in combo_results.items():
        if (a_choice == 2 and b_choice == 1) or \
           (a_choice == 3 and b_choice == 2):
            for outcome, count in counts.items():
                clean = outcome.replace(" ", "")
                alice_bit = int(clean[-1]) if len(clean) >= 1 and clean[-1] in "01" else 0
                bob_bit = int(clean[-2]) if len(clean) >= 2 and clean[-2] in "01" else 0

                total_compared += count
                # Singlet state |ψ⁻⟩: results should be ANTI-correlated.
                # Anti-correlated (different bits) = correct → extract key bit.
                # Correlated (same bits) = error, likely from eavesdropper.
                if alice_bit != bob_bit:
                    key_bits.extend([alice_bit] * count)
                else:
                    mismatches += count

    qber = mismatches / total_compared if total_compared > 0 else 0.0
    key = "".join([str(b) for b in key_bits])

    return key, qber
