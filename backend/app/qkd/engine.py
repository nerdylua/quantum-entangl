"""
QKD Engine - Orchestrates protocol selection, iterative key generation, and QBER thresholds.

Generates proper 128-bit keys through iterative rounds (unlike QuantumChat's 4-bit repeat).
Auto-selects GHZ protocol for rooms with 3+ parties.
"""

import asyncio
import time
from dataclasses import dataclass

from app.qkd import bell_state, bb84, e91, ghz


@dataclass
class KeyResult:
    key: str | None
    qber: float
    status: str  # "OK" or "COMPROMISED"
    protocol: str
    time_taken: float
    rounds: int
    key_length: int


PROTOCOL_MAP = {
    "bell_state": bell_state,
    "bb84": bb84,
    "e91": e91,
    "ghz": ghz,
}

QBER_THRESHOLDS = {
    "bell_state": 0.25,
    "bb84": 0.11,
    "e91": 0.11,
    "ghz": 0.11,
}

# Protocol-specific round sizes to balance speed vs key yield
# E91 has ~22% key yield, so needs larger rounds
ROUND_SIZES = {
    "bell_state": 64,  # Larger: only ~8.3% of trials produce key bits (1/12 match rate)
    "bb84": 32,
    "e91": 128,  # Larger to compensate for low key yield (~22%)
    "ghz": 32,
}


def resolve_protocol(protocol: str, n_parties: int) -> str:
    """Auto-select GHZ for 3+ party rooms, otherwise use user-selected protocol."""
    if n_parties >= 3:
        return "ghz"
    return protocol


async def generate_key(
    protocol: str,
    key_length: int = 128,
    eavesdropper: bool = False,
    n_parties: int = 2,
) -> KeyResult:
    """
    Generate a QKD key using the specified protocol.

    Runs iterative rounds until key_length bits are collected.
    If QBER exceeds the threshold for the protocol, returns COMPROMISED status.
    For 3+ parties, auto-selects GHZ protocol.
    """
    # Auto-select protocol based on party count
    protocol = resolve_protocol(protocol, n_parties)

    start_time = time.time()
    protocol_impl = PROTOCOL_MAP.get(protocol)

    if not protocol_impl:
        return KeyResult(
            key=None,
            qber=0.0,
            status="ERROR",
            protocol=protocol,
            time_taken=0.0,
            rounds=0,
            key_length=0,
        )

    threshold = QBER_THRESHOLDS[protocol]
    key = ""
    qber_samples = []
    rounds = 0
    max_rounds = key_length * 2

    while len(key) < key_length:
        rounds += 1

        if rounds > max_rounds:
            elapsed = time.time() - start_time
            avg_qber = sum(qber_samples) / len(qber_samples) if qber_samples else 0.0
            return KeyResult(
                key=None,
                qber=avg_qber,
                status="ERROR",
                protocol=protocol,
                time_taken=elapsed,
                rounds=rounds,
                key_length=len(key),
            )

        # Build kwargs — use protocol-specific round size, GHZ needs n_parties
        kwargs = {
            "round_size": ROUND_SIZES.get(protocol, 32),
            "eavesdropper": eavesdropper,
        }
        if protocol == "ghz":
            kwargs["n_parties"] = n_parties

        # Run QKD in a thread to avoid blocking the event loop
        try:
            round_key, round_qber = await asyncio.to_thread(
                protocol_impl.generate_round,
                **kwargs,
            )
        except Exception as e:
            print(f"Protocol {protocol} round {rounds} error: {e}")
            # Return error status to allow retry at higher level
            elapsed = time.time() - start_time
            return KeyResult(
                key=None,
                qber=0.0,
                status="ERROR",
                protocol=protocol,
                time_taken=elapsed,
                rounds=rounds,
                key_length=0,
            )

        # Handle empty key (e.g., from E91 error fallback)
        if not round_key:
            continue

        qber_samples.append(round_qber)

        # QBER threshold check
        if round_qber > threshold:
            elapsed = time.time() - start_time
            avg_qber = sum(qber_samples) / len(qber_samples)
            return KeyResult(
                key=None,
                qber=avg_qber,
                status="COMPROMISED",
                protocol=protocol,
                time_taken=elapsed,
                rounds=rounds,
                key_length=0,
            )

        key += round_key

    key = key[:key_length]
    elapsed = time.time() - start_time
    avg_qber = sum(qber_samples) / len(qber_samples) if qber_samples else 0.0

    return KeyResult(
        key=key,
        qber=avg_qber,
        status="OK",
        protocol=protocol,
        time_taken=elapsed,
        rounds=rounds,
        key_length=key_length,
    )
