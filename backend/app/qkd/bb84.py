"""
BB84 QKD Protocol - Ported to Qiskit 1.0+ API.

Alice encodes random bits in random bases (rectilinear: X gate, diagonal: X+H).
Bob measures in random bases (rectilinear: direct measure, diagonal: H then measure).
Sifting: keep only bits where bases matched.
QBER computed from sifted key comparison.

Each qubit is processed in its own 1-qubit circuit to avoid exceeding simulator limits.
"""

import numpy as np
from qiskit import QuantumCircuit, ClassicalRegister, transpile
from qiskit_aer import Aer

backend = Aer.get_backend("qasm_simulator")


def generate_round(round_size: int = 32, eavesdropper: bool = False):
    """
    Run one round of the BB84 QKD protocol.

    Each bit uses an independent 1-qubit circuit (BB84 qubits are not entangled),
    avoiding the simulator's qubit-count limit.

    Returns:
        (key_bits: str, qber: float)
    """
    n_bits = round_size

    # Alice generates random bits and bases
    alice_bits = np.random.randint(2, size=n_bits)
    alice_basis = np.random.randint(2, size=n_bits)  # 0=rectilinear, 1=diagonal
    bob_basis = np.random.randint(2, size=n_bits)

    bob_bits = np.zeros(n_bits, dtype=int)

    # Build one circuit per qubit
    circuits = []
    for i in range(n_bits):
        qc = QuantumCircuit(1, 1)

        # Alice encodes
        if alice_basis[i] == 0:  # Rectilinear basis
            if alice_bits[i] == 1:
                qc.x(0)
        else:  # Diagonal basis
            if alice_bits[i] == 0:
                qc.h(0)
            else:
                qc.x(0)
                qc.h(0)

        qc.barrier()

        # Eavesdropper (intercept-resend)
        if eavesdropper:
            eve_basis = np.random.randint(2)
            eve_reg = ClassicalRegister(1, "eve")
            qc.add_register(eve_reg)
            if eve_basis == 1:
                qc.h(0)
            qc.measure(0, eve_reg[0])
            if eve_basis == 1:
                qc.h(0)
            qc.barrier()

        # Bob measures
        if bob_basis[i] == 1:  # Diagonal basis
            qc.h(0)
        qc.measure(0, 0)

        circuits.append(qc)

    # Batch-run all circuits
    transpiled = transpile(circuits, backend)
    job = backend.run(transpiled, shots=1)
    result = job.result()

    for i in range(n_bits):
        counts = result.get_counts(i)
        res = list(counts.keys())[0]
        # Bob's result is the last character (main register)
        clean = res.replace(" ", "")
        bob_bits[i] = int(clean[-1])

    # Sifting: keep only bits where bases matched
    matching_bases = alice_basis == bob_basis
    sifted_alice = alice_bits[matching_bases]
    sifted_bob = bob_bits[matching_bases]

    # Calculate QBER from sifted bits
    if len(sifted_alice) > 0:
        errors = np.sum(sifted_alice != sifted_bob)
        qber = float(errors / len(sifted_alice))
    else:
        qber = 0.0

    # Generate key from sifted bits
    key = "".join([str(b) for b in sifted_alice])

    return key, qber
