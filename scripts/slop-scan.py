#!/usr/bin/env python3
"""Scan text for the tells the de-AI-slop rulebook already quotes.

This script invents nothing. Every pattern it looks for is parsed at run time out of
the "Words to watch:" lines inside writing/de-ai-slop-rulebook.md, which are verbatim
quotes from the cited sources. Change the rulebook and this scanner changes with it;
there is no second list to keep in sync.

    python scripts/slop-scan.py FILE [FILE ...]
    python scripts/slop-scan.py --list          # show the patterns it will look for
    python scripts/slop-scan.py --self-test     # positive and negative control

Exit code is 1 when a file has hits, so it can gate a handover. A hit is not a verdict:
the rulebook's own Caveats section says these are potential signs of a problem, not the
problem itself, and that the tells punish non-native writers hardest. Read the flagged
line and decide. This is the Gould-proof posture the rulebook quotes: mark the margin,
hand it back, and if the writer prefers warts, warts prevail.
"""
from __future__ import annotations

import argparse
import itertools
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RULEBOOK = os.path.join(HERE, "..", "writing", "de-ai-slop-rulebook.md")

# Entries that are shapes rather than literal strings; the rulebook explains them in
# prose and a substring scan would only produce noise.
SKIP_ENTRIES = {"...", "such as", "refers to", "as of [date]"}


def load_patterns(path):
    """-> list of (phrase, section) parsed from quoted 'Words to watch:' lines."""
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")

    out, section = [], "(top)"
    for line in lines:
        if line.startswith("### ") or line.startswith("## "):
            section = line.lstrip("#").strip()
            continue
        if not line.startswith(">"):
            continue
        body = line.lstrip(">").strip()
        if not body.lower().startswith("words to watch:"):
            continue
        body = body.split(":", 1)[1]
        for raw in body.split(","):
            entry = raw.strip().rstrip(".").strip()
            entry = re.sub(r"\s*\([^)]*\)", "", entry)      # drop "(as a verb)" notes
            entry = entry.replace("[a]", "").strip()
            entry = entry.strip('"').strip("'").strip()
            if not entry or entry in SKIP_ENTRIES or entry.startswith("..."):
                continue
            if len(entry) < 3:
                continue
            for phrase in expand(entry):
                if phrase and phrase not in [p for p, _ in out]:
                    out.append((phrase, section))
                if INFLECT_SECTION in section.lower():
                    for form in inflect(phrase):
                        if form not in [p for p, _ in out]:
                            out.append((form, section))
    return out


def expand(entry):
    """'underscores/highlights its importance' -> both readings."""
    entry = entry.replace("...", "").strip()
    if not entry:
        return []
    groups = [w.split("/") if "/" in w else [w] for w in entry.split()]
    combos = [" ".join(t) for t in itertools.product(*groups)]
    return [c.strip() for c in combos if len(c.strip()) >= 3]


# The vocabulary list is written in dictionary form ("delve", "showcase", "underscore")
# and the prose that appears in the wild is inflected ("delving", "showcasing",
# "underscored"). Kobak et al. measured the excess on the inflections too, and say so:
#
#     "Less common words with strong excess usage included delves (r = 28.0),
#      showcasing (r = 10.2) and underscores (r = 10.9), together with their
#      grammatical inflections"
#
# so matching them is the cited finding rather than an addition to it. Only words from
# the AI-vocabulary section inflect, and only those of five letters or more: "key" and
# "hit" are already the noisiest patterns here, and "keys" and "hits" would be worse.
INFLECT_SECTION = "ai vocabulary"
ANCHOR_SECTION = "collaborative communication"
INFLECT_MIN_LEN = 5


def inflect(word):
    """'delve' -> delves, delved, delving. Crude on purpose; a wrong form matches nothing."""
    w = word.lower()
    if len(w) < INFLECT_MIN_LEN or " " in w:
        return []
    if w.endswith("e"):
        stem = w[:-1]
        return [w + "s", w + "d", stem + "ing"]
    if w.endswith("y") and len(w) > 2 and w[-2] not in "aeiou":
        stem = w[:-1]
        return [stem + "ies", stem + "ied", w + "ing"]
    if w.endswith(("s", "x", "z", "ch", "sh")):
        return [w + "es", w + "ed", w + "ing"]
    return [w + "s", w + "ed", w + "ing"]


def scan(text, patterns, include_quoted=False):
    """-> list of (line_no, line, phrase, section).

    Fenced code is skipped always. Blockquote lines are skipped unless include_quoted:
    a quoted passage is an example someone is showing you, not prose to repair, and
    every doc that quotes bad writing (this rulebook first of all) would otherwise
    light up.
    """
    hits, in_fence, in_refs = [], False, False
    prev = ""
    for n, line in enumerate(text.split("\n"), 1):
        if line.strip().startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        # A reference list is other people's titles. Roediger and Karpicke published
        # "Test-enhanced learning" in 2006, and flagging "enhanced" there asks the
        # writer to edit a citation, which is the one thing they must not do.
        if line.startswith("#"):
            in_refs = re.match(r"#+\s*(references?|bibliography|further reading)\s*$",
                               line.strip(), re.I) is not None
        if in_refs:
            continue
        if not include_quoted and line.lstrip().startswith(">"):
            continue
        low = line.lower()
        # Prose here is hard-wrapped, so the first word of a line is usually mid-sentence:
        # "The shape / here is a nightly worker" breaks across two lines and would look
        # like an opener to anything that trusts column 1. A line only opens a sentence
        # when the line before it ended one.
        starts_sentence = (not prev.strip()
                           or prev.rstrip().endswith((".", "!", "?", ":"))
                           or line.lstrip().startswith(("#", "-", "*", "+", "|")))
        opener = low.lstrip("-*+#> ").strip() if starts_sentence else " " + low
        prev = line
        for phrase, section in patterns:
            body = re.escape(phrase.lower())
            # The chatbot-turn phrases are openers: "Here is a summary", "Of course!",
            # "Let me know". Mid-sentence they are ordinary English, and "the shape here
            # is a nightly worker" is not a chatbot talking to you. Anchor those to the
            # start of a line or of a sentence; leave every other pattern free-floating.
            if ANCHOR_SECTION in section.lower():
                found = re.search(r"(?:^|(?<=[.!?]\s)|(?<=[.!?]\s\s))" + body + r"(?![a-z])",
                                  opener)
            else:
                found = re.search(r"(?<![a-z])" + body + r"(?![a-z])", low)
            if found:
                hits.append((n, line.strip(), phrase, section))
    return hits


def report(path, hits):
    if not hits:
        print("  clean: %s" % path)
        return
    print("  %s: %d hit%s" % (path, len(hits), "" if len(hits) == 1 else "s"))
    for n, line, phrase, section in hits:
        snippet = line if len(line) <= 96 else line[:93] + "..."
        print('    %s:%d  "%s"  [%s]' % (os.path.basename(path), n, phrase, section))
        print("        %s" % snippet)


SLOPPY = (
    "Somi stands as a testament to modern care. Its meticulous design underscores its "
    "importance in the evolving landscape of family health, showcasing a robust and "
    "vibrant tapestry of features that boasts a commitment to delving into what matters."
)
# The same register with every tell inflected away from its dictionary form. Before the
# inflection rule this scored zero, which is the shape of the miss: the list is written
# in infinitives and nobody writes in infinitives.
SLOPPY_INFLECTED = (
    "The team delved into the intricacies, underscored the pivotal moment, and enhanced "
    "a landscape of fostering partnerships that showcased their enduring tapestries."
)
CLEAN = (
    "Somi books the appointment. It refills the prescription three days before it runs "
    "out. Last week it caught that Mum's blood sugar ran high on the days she skipped "
    "breakfast, and it told her daughter, who called."
)


def self_test(patterns):
    bad = scan(SLOPPY, patterns)
    inflected = scan(SLOPPY_INFLECTED, patterns)
    good = scan(CLEAN, patterns)
    print("self-test")
    print("  sloppy control:    %d hits (expect several)" % len(bad))
    for _, _, phrase, _ in bad:
        print("      %s" % phrase)
    print("  inflected control: %d hits (expect several)" % len(inflected))
    for _, _, phrase, _ in inflected:
        print("      %s" % phrase)
    print("  clean control:     %d hits (expect 0)" % len(good))
    for _, line, phrase, _ in good:
        print("      FALSE POSITIVE %r in %r" % (phrase, line))
    ok = len(bad) >= 5 and len(inflected) >= 4 and len(good) == 0
    print("  result: %s" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def _utf8_stdout():
    """A console in cp1252 dies on the first arrow it is asked to print.

    The snippets this prints come out of other people's files, which contain arrows,
    dashes and accents. Crashing on one of them aborts the scan partway with a
    traceback, and a partial scan that ends in an exception is worse than a slow one:
    the files after the arrow were never looked at.
    """
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="*")
    ap.add_argument("--list", action="store_true", help="print the parsed patterns and exit")
    ap.add_argument("--self-test", action="store_true", help="run the controls and exit")
    ap.add_argument("--rulebook", default=RULEBOOK)
    ap.add_argument("--section", help="only patterns whose rulebook section matches this substring")
    ap.add_argument("--include-quoted", action="store_true",
                    help="also scan blockquoted lines (they are skipped by default)")
    ap.add_argument("--multiword", action="store_true",
                    help="skip one-word patterns; single common words (only, actually, key) "
                         "carry most of the noise in technical prose")
    args = ap.parse_args(argv)
    _utf8_stdout()

    patterns = load_patterns(args.rulebook)
    if args.section:
        needle = args.section.lower()
        patterns = [(p, s) for p, s in patterns if needle in s.lower()]
    if args.multiword:
        patterns = [(p, s) for p, s in patterns if " " in p]
    if not patterns:
        print("no patterns parsed from %s" % args.rulebook, file=sys.stderr)
        return 2

    if args.list:
        print("%d patterns from %s" % (len(patterns), os.path.relpath(args.rulebook)))
        for phrase, section in patterns:
            print("  %-46s  [%s]" % (phrase, section))
        return 0

    if args.self_test:
        return self_test(patterns)

    if not args.files:
        ap.print_usage()
        return 2

    total = 0
    # Say which half ran. Reporting a file "clean" after a --multiword run, without
    # saying that every single-word tell (robust, delve, tapestry) sat the round out,
    # is how a scan gets read as a verdict it never made.
    mode = "multiword only; single-word tells NOT checked" if args.multiword else "full list"
    print("scanning against %d quoted patterns (%s)" % (len(patterns), mode))
    for path in args.files:
        try:
            with open(path, encoding="utf-8") as f:
                text = f.read()
        except OSError as e:
            print("  skip %s (%s)" % (path, e))
            continue
        hits = scan(text, patterns, args.include_quoted)
        total += len(hits)
        report(path, hits)
    print("%d hit%s total" % (total, "" if total == 1 else "s"))
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
