import numpy as np
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def _pad_or_trim(seq: np.ndarray, seq_len: int = 30) -> np.ndarray:
    """Take first seq_len frames; zero-pad if shorter."""
    n = len(seq)
    if n >= seq_len:
        return seq[:seq_len]
    pad = np.zeros((seq_len - n, seq[0].shape[0]), dtype=np.float32)
    return np.vstack([seq, pad])


def test_trim_long_sequence():
    seq = np.ones((40, 225), dtype=np.float32)
    result = _pad_or_trim(seq)
    assert result.shape == (30, 225)
    assert np.all(result == 1.0)


def test_pad_short_sequence():
    seq = np.ones((10, 225), dtype=np.float32)
    result = _pad_or_trim(seq)
    assert result.shape == (30, 225)
    assert np.all(result[:10] == 1.0)
    assert np.all(result[10:] == 0.0)


def test_exact_length_unchanged():
    seq = np.ones((30, 225), dtype=np.float32) * 3.0
    result = _pad_or_trim(seq)
    assert result.shape == (30, 225)
    assert np.all(result == 3.0)
