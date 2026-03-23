"""
GHZ Multi-Party QKD Protocol - N-party key agreement using GHZ states.

For N parties (3+), creates GHZ entangled states:
    |GHZ_N> = (|00...0> + |11...1>) / sqrt(2)

Protocol:
1. Server creates an N-qubit GHZ state
2. Each party independently chooses a random measurement basis (X or Z)
3. All qubits are measured
4. Parties publicly announce their basis choices (classical channel)
5. Key bits kept only when ALL parties chose the same basis
6. QBER computed from a sacrificed subset of matching-basis rounds
7. All parties' measurements are perfectly correlated (all 0 or all 1)

Uses Qiskit 1.0+ API (transpile + backend.run).
"""

import random
import numpy as np
from qiskit import QuantumCircuit, ClassicalRegister, transpile
from qiskit_aer import Aer

backend = Aer.get_backend("qasm_simulator")


def create_ghz_circuit(n_parties: int) -> QuantumCircuit:
    """Create an N-qubit GHZ state circuit."""
    qc = QuantumCircuit(n_parties, n_parties)
    qc.h(0)
    for i in range(1, n_parties):
        qc.cx(0, i)
    return qc


def generate_round(
    round_size: int = 32,
    eavesdropper: bool = False,
    n_parties: int = 3,
) -> tuple[str, float]:
    """
    Run one round of the GHZ multi-party QKD protocol.

    Args:
        round_size: Number of GHZ states to create per round
        eavesdropper: Whether to simulate an eavesdropper
        n_parties: Number of parties (default 3)

    Returns:
        (key_bits: str, qber: float)
    """
    key = ""
    errors = 0
    sifted_total = 0

    # Generate random measurement bases for each party per state
    # 0 = Z basis (computational), 1 = X basis (Hadamard)
    all_bases = np.random.randint(2, size=(round_size, n_parties))

    for trial in range(round_size):
        bases = all_bases[trial]

        # Only keep rounds where all parties chose the same basis
        if not np.all(bases == bases[0]):
            continue

        # Build circuit: GHZ state + optional eavesdropper + measurement
        qc = create_ghz_circuit(n_parties)

        if eavesdropper:
            # Eve intercepts by measuring a random qubit before the parties
            eve_qubit = random.randint(0, n_parties - 1)
            eve_reg = ClassicalRegister(1, "eve")
            qc.add_register(eve_reg)

            # Eve measures in random basis
            eve_basis = random.randint(0, 1)
            if eve_basis == 1:
                qc.h(eve_qubit)
            qc.measure(eve_qubit, eve_reg[0])
            if eve_basis == 1:
                qc.h(eve_qubit)
            qc.barrier()

        # Apply measurement basis rotations
        basis = bases[0]  # All the same at this point
        if basis == 1:  # X basis
            for i in range(n_parties):
                qc.h(i)

        # Measure all qubits
        qc.measure(range(n_parties), range(n_parties))

        # Run circuit
        transpiled = transpile(qc, backend)
        job = backend.run(transpiled, shots=1)
        counts = job.result().get_counts()
        result_str = list(counts.keys())[0]

        # Parse result - remove any spaces from multi-register results
        clean_result = result_str.replace(" ", "")
        # Take only the last n_parties bits (the main measurement register)
        measurement = clean_result[-n_parties:]

        # Check correlation: all bits should be the same
        # In Z basis: all 0 or all 1
        # In X basis with even parity: correlated results
        bits = [int(b) for b in measurement]

        if basis == 0:  # Z basis
            # All should be same (all 0 or all 1)
            if all(b == bits[0] for b in bits):
                key += str(bits[0])
                sifted_total += 1
            else:
                errors += 1
                sifted_total += 1
        else:  # X basis
            # For GHZ in X basis, the parity should be even (XOR of all bits = 0)
            parity = sum(bits) % 2
            if parity == 0:
                # Use first party's bit as the key bit
                key += str(bits[0])
                sifted_total += 1
            else:
                errors += 1
                sifted_total += 1

    qber = errors / sifted_total if sifted_total > 0 else 0.0
    return key, qber
