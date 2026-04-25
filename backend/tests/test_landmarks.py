import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pytest
from scripts.extract_landmarks import normalize, flip_x


class _FakeLandmark:
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z


def _make_landmarks(pts):
    return [_FakeLandmark(x, y, z) for x, y, z in pts]


def test_normalize_wrist_at_origin():
    """After normalize(), landmark 0 (wrist) must be at (0,0,0)."""
    pts = [(float(i), float(i) * 0.5, float(i) * 0.1) for i in range(21)]
    lms = _make_landmarks(pts)
    result = normalize(lms)
    # first 3 values are x0, y0, z0 — must all be 0
    assert result[0] == pytest.approx(0.0, abs=1e-6)
    assert result[1] == pytest.approx(0.0, abs=1e-6)
    assert result[2] == pytest.approx(0.0, abs=1e-6)


def test_normalize_scale_invariant():
    """Scaling all landmarks by a constant must not change normalize() output."""
    pts = [(float(i + 1), float(i + 1) * 0.3, float(i + 1) * 0.2) for i in range(21)]
    lms1 = _make_landmarks(pts)
    lms2 = _make_landmarks([(x * 3, y * 3, z * 3) for x, y, z in pts])
    r1 = normalize(lms1)
    r2 = normalize(lms2)
    np.testing.assert_allclose(r1, r2, atol=1e-5)


def test_flip_x_negates_x_coords():
    """flip_x() must negate the x coordinate of each of the 21 landmarks."""
    features = [float(i + 1) for i in range(63)] + [0.5] * 10  # 63 xyz + 10 angles
    flipped = flip_x(features)
    for i in range(21):
        assert flipped[i * 3] == -features[i * 3]
        assert flipped[i * 3 + 1] == features[i * 3 + 1]  # y unchanged
        assert flipped[i * 3 + 2] == features[i * 3 + 2]  # z unchanged


def test_flip_x_angles_unchanged():
    """flip_x() must not modify the angle features (last 10 values)."""
    features = [1.0] * 63 + [0.1 * i for i in range(10)]
    flipped = flip_x(features)
    assert flipped[63:] == features[63:]
