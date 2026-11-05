import pytest

from licence_check import is_allowed, licence_terms


@pytest.mark.parametrize("lic", [
    "MIT", "MIT License", "Apache-2.0", "Apache Software License; MIT License", "BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0",
    "MPL-2.0 AND (Apache-2.0 OR MIT)", "Mozilla Public License 2.0 (MPL 2.0)", "LGPL-3.0-only", "ISC License (ISCL)",
    "Academic Free License (AFL); MIT License", "Apache-2.0 AND CNRI-Python", "MIT-CMU", "3-Clause BSD License",
    "MIT License\n\nCopyright (c) 2022 OpenAI\n\nPermission is hereby granted...",
])
def test_allowed(lic):
    assert is_allowed(lic), licence_terms(lic)


@pytest.mark.parametrize("lic", [
    "GPL-3.0-only", "AGPL-3.0", "GNU General Public License v3 (GPLv3)", "SSPL-1.0", "BUSL-1.1",
    "UNKNOWN", "", "Proprietary", "CC-BY-NC-4.0", "MIT OR Commons-Clause", "Permission is hereby granted, free of charge",
])
def test_rejected(lic):
    assert not is_allowed(lic)
