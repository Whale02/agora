#!/usr/bin/env python3
"""Measure the structural tells the de-AI-slop rulebook names, the ones no word list can see.

slop-scan.py covers the vocabulary half. This covers the shapes: em dashes, curly quotes,
bullet-bold-colon lists, emoji markers, title-case headings, the rule of three, negative
parallelism, and sentence-length monotony.

Every metric here is tied to a section of docs/design/writing-guidelines.md, and the quote
that motivates it is pulled out of that file at run time and printed with the number. If a
section is renamed or removed, this script says so instead of silently measuring something
the rulebook no longer claims.

    python scripts/slop-shapes.py FILE [FILE ...]
    python scripts/slop-shapes.py --why                 # metrics and the quotes behind them
    python scripts/slop-shapes.py --self-test           # positive and negative control
    python scripts/slop-shapes.py --fail-on em_dash_per_1k,negative_parallelism FILE

It reports numbers and exits 0 by default. It sets no thresholds of its own: the rulebook
quotes say these shapes are overused, not that N is the limit, and inventing a limit here
would be exactly the kind of made-up rule the rulebook exists to keep out. Use --fail-on to
gate on the metrics you care about, which is a decision a person makes, not this script.
"""
from __future__ import annotations

import argparse
import os
import re
import statistics
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
RULEBOOK = os.path.join(HERE, "..", "writing", "de-ai-slop-rulebook.md")

# metric key -> (label, rulebook section it comes from)
METRICS = [
    ("em_dash_per_1k",      "em dashes per 1000 words",        "Overuse of em dashes"),
    ("spaced_em_dash",      "em dashes with spaces around",    "Overuse of em dashes"),
    ("curly_quotes",        "curly quotes / apostrophes",      "Curly quotation marks and apostrophes"),
    ("bullet_bold_colon",   "bullets with a bold header+colon", "Inline-header vertical lists"),
    ("emoji_markers",       "emoji starting a heading/bullet",  "Emoji as formatting"),
    ("title_case_headings", "headings in Title Case",           "Title case"),
    ("rule_of_three",       "three-item 'a, b, and c' runs",    "Rule of three"),
    ("negative_parallelism", "not-X-but-Y constructions",       "Negative parallelisms"),
    ("sentence_len_stdev",  "sentence-length spread (stdev)",   "Monotony"),
    ("short_sentence_share", "share of sentences under 6 words", "Monotony"),
    ("top_connective_per_1k", "busiest single connective, per 1k words", "Monotony"),
]

# Not a word list. These are the joints a sentence turns on, and the point is the
# distribution: one of them running far ahead of the others is a writer reaching for the
# same joint every time. It is what banning a construction does — outlaw "not X but Y"
# and the whole load moves onto "rather than", which no existing metric here can see.
# Reported as the busiest single phrase, so the number names its own offender.
CONNECTIVES = [
    "rather than", "instead of", ", not ", "which is", "which means", "so that",
    "because of", "in order to", "as well as", "that is why", "the way",
    "even when", "even if", "if anything", "and yet", "at least",
]

NEG_PARALLEL = [
    r"\bnot only\b[^.?!]{0,80}?\bbut\b",
    r"\bnot just\b[^.?!]{0,80}?\bbut\b",
    r"\bit'?s not\b[^.?!]{0,60}?,\s*it'?s\b",
    r"\bisn'?t just\b",
    r"\bno [a-z]+,\s*no [a-z]+,\s*just\b",
]
RULE_OF_THREE = re.compile(r"\b(\w+), (\w+),? and (\w+)\b")
# The colon lands either just inside the bold ("- **Fast:** logs in seconds") or just
# outside it ("- **Fast**: logs in seconds"); both are the same shape.
BULLET_BOLD_COLON = re.compile(
    r"^\s*(?:[-*+]|\d+\.)\s+\*\*[^*]+\*\*\s*:"
    r"|^\s*(?:[-*+]|\d+\.)\s+\*\*[^*]+:\s*\*\*"
)
SMALL_WORDS = {"a", "an", "and", "the", "of", "in", "on", "for", "to", "with", "at",
               "by", "from", "as", "is", "it", "or", "but", "not", "that", "this"}


# Verdict glyphs mark a judgement about an example; they are not decoration, and the
# rulebook's own good/bad example lists are built from them.
VERDICT_GLYPHS = set("✓✔✗✘×→←↔•❌✅⚠️⛔")


def is_emoji(ch):
    if ch in VERDICT_GLYPHS:
        return False
    return unicodedata.category(ch) == "So" or ord(ch) > 0x1F000


def load_quotes(path):
    """-> {section: first quoted line}, so each number prints with its justification."""
    try:
        with open(path, encoding="utf-8") as f:
            lines = f.read().split("\n")
    except OSError:
        return {}
    out, section = {}, None
    for line in lines:
        if line.startswith("#"):
            section = line.lstrip("#").strip()
            continue
        if section and line.startswith(">") and section not in out:
            body = line.lstrip(">").strip()
            if body and not body.lower().startswith("words to watch"):
                out[section] = body
    return out


def prose_lines(text, include_quoted=False):
    """Prose only: no fenced code, no blockquotes (unless asked), no attribution lines,
    no table rows.

    An attribution under a quote ("— Gary Provost, 100 Ways to Improve Your Writing") is
    metadata: counting its dash as prose punctuation put 103 false em dashes into this
    rulebook's own score. Table rows are structured data, and their cells wreck any
    sentence-length statistic.
    """
    out, in_fence = [], False
    for line in text.split("\n"):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if not include_quoted and stripped.startswith(">"):
            continue
        if stripped.startswith("—") or stripped.startswith("--"):
            continue
        if stripped.startswith("|"):
            continue
        out.append(line)
    return out


def measure(text, include_quoted=False):
    lines = prose_lines(text, include_quoted)
    body = "\n".join(lines)
    words = re.findall(r"[A-Za-z']+", body)
    n_words = max(len(words), 1)

    # Segment per block, not across the whole file: a heading or a list item is its own
    # unit, and prose paragraphs may wrap over several lines. Splitting the file as one
    # string merges an entire link list into a single 400-word "sentence" and the
    # length spread becomes meaningless.
    blocks, cur = [], []
    for line in lines:
        s = line.strip()
        if not s:
            if cur:
                blocks.append(" ".join(cur))
                cur = []
            continue
        if re.match(r"^(#|[-*+]\s|\d+\.\s)", s):
            if cur:
                blocks.append(" ".join(cur))
                cur = []
            blocks.append(re.sub(r"^(#+|[-*+]|\d+\.)\s*", "", s))
            continue
        cur.append(s)
    if cur:
        blocks.append(" ".join(cur))

    sentences = []
    for b in blocks:
        parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+", b) if p.strip()]
        sentences.extend(parts or [b])
    sent_lens = [len(re.findall(r"[A-Za-z']+", s)) for s in sentences]
    sent_lens = [n for n in sent_lens if n > 0]

    headings = [l.lstrip("#").strip() for l in lines if l.startswith("#")]
    title_case = 0
    for h in headings:
        ws = [w for w in re.findall(r"[A-Za-z']+", h)]
        if len(ws) < 4:
            continue
        main = [w for w in ws if w.lower() not in SMALL_WORDS]
        if main and sum(1 for w in main if w[:1].isupper()) / len(main) >= 0.8:
            title_case += 1

    emoji = 0
    for l in lines:
        s = l.lstrip("#-*+ 0123456789.").strip()
        if s and is_emoji(s[0]):
            emoji += 1

    neg = sum(len(re.findall(p, body, re.I)) for p in NEG_PARALLEL)

    counts = [(body.lower().count(c), c) for c in CONNECTIVES]
    top_n, top_phrase = max(counts) if counts else (0, "")

    return {
        "_words": n_words,
        "_top_connective": top_phrase.strip() if top_n else "",
        "em_dash_per_1k": round(body.count("—") * 1000.0 / n_words, 2),
        "spaced_em_dash": len(re.findall(r"\s—\s", body)),
        "curly_quotes": sum(body.count(c) for c in "‘’“”"),
        "bullet_bold_colon": sum(1 for l in lines if BULLET_BOLD_COLON.match(l)),
        "emoji_markers": emoji,
        "title_case_headings": title_case,
        "rule_of_three": len(RULE_OF_THREE.findall(body)),
        "negative_parallelism": neg,
        "sentence_len_stdev": round(statistics.pstdev(sent_lens), 2) if len(sent_lens) > 1 else 0.0,
        "short_sentence_share": round(sum(1 for n in sent_lens if n < 6) / len(sent_lens), 2) if sent_lens else 0.0,
        "top_connective_per_1k": round(top_n * 1000.0 / n_words, 2),
    }


def print_report(path, vals, quotes, show_why):
    # Word count on the header line: every per-1k rate below is one occurrence divided by
    # this, and on a 200-word file a single "instead of" reads as 5 per 1000.
    print("  %s  (%d words)" % (path, vals.get("_words", 0)))
    for key, label, section in METRICS:
        shown = label
        if key == "top_connective_per_1k" and vals.get("_top_connective"):
            shown = "%s (%r)" % (label, vals["_top_connective"])
        print("    %-22s %8s   %s" % (key, vals[key], shown))
        if show_why:
            q = quotes.get(section)
            if q is None:
                print("        (rulebook section %r not found: metric may be stale)" % section)
            else:
                print("        %s: \"%s\"" % (section, q[:150] + ("..." if len(q) > 150 else "")))


SLOPPY = """## The Vibrant Landscape Of Family Care

Somi isn't just an app — it's a companion. Not only does it track, but it also
understands. It's not a dashboard, it's a friend.

- **Fast:** logs in seconds.
- **Smart:** learns your patterns.
- **Kind:** never judges.

It is simple, powerful, and delightful.
"""

CLEAN = """## What Somi does today

Somi books the appointment. It refills the prescription three days before it runs out.

Last week it caught that Mum's blood sugar ran high on the days she skipped breakfast,
and it told her daughter, who called. That is the whole product: the work moves off the
person who was carrying it, and the family still knows what happened.
"""


# One construction doing all the work, against the same argument made with varied joints.
# Both say the same things; only the distribution of connectives differs.
MONOTONE_CONNECTIVE = """The store ranks by use rather than by age. It reranks rather
than filters. Exposure counts a tenth of a use rather than a full one. Weight sorts
rather than hides, and pinning is a human decision rather than a model's.
"""
VARIED_CONNECTIVE = """The store ranks by use, not by age. It reranks; it never filters.
Exposure counts a tenth of a use. Weight sorts and hides nothing, and pinning is a human
decision the model does not get to relitigate.
"""


def self_test(quotes):
    bad, good = measure(SLOPPY), measure(CLEAN)
    mono, varied = measure(MONOTONE_CONNECTIVE), measure(VARIED_CONNECTIVE)
    print("self-test")
    checks = [
        ("negative_parallelism", bad["negative_parallelism"] >= 3, good["negative_parallelism"] == 0),
        ("bullet_bold_colon",    bad["bullet_bold_colon"] == 3,    good["bullet_bold_colon"] == 0),
        ("title_case_headings",  bad["title_case_headings"] == 1,  good["title_case_headings"] == 0),
        ("rule_of_three",        bad["rule_of_three"] >= 1,        good["rule_of_three"] == 0),
        ("spaced_em_dash",       bad["spaced_em_dash"] == 1,       good["spaced_em_dash"] == 0),
        # Rate alone is sample-size noise on a five-sentence control; what the metric
        # claims is that concentration shows up as a multiple of the varied version.
        ("top_connective_per_1k",
         mono["top_connective_per_1k"] >= 2.5 * varied["top_connective_per_1k"],
         varied["top_connective_per_1k"] < mono["top_connective_per_1k"]),
    ]
    ok = True
    for name, pos, neg in checks:
        if name == "top_connective_per_1k":
            line = "  %-22s monotone=%-5s varied=%-5s" % (
                name, mono[name], varied[name])
        else:
            line = "  %-22s sloppy=%-6s clean=%-6s" % (name, bad[name], good[name])
        verdict = "ok" if (pos and neg) else "FAIL"
        if not (pos and neg):
            ok = False
        print("%s %s" % (line, verdict))
    missing = [s for _, _, s in METRICS if s not in quotes]
    if missing:
        ok = False
        print("  rulebook sections not found: %s" % ", ".join(sorted(set(missing))))
    else:
        print("  every metric maps to a live rulebook section")
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
    ap.add_argument("--why", action="store_true", help="print the rulebook quote behind each metric")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--include-quoted", action="store_true",
                    help="also measure blockquoted lines (skipped by default)")
    ap.add_argument("--fail-on", default="",
                    help="comma-separated metric names; exit 1 if any is above zero "
                         "(or above the value given as name=N)")
    ap.add_argument("--rulebook", default=RULEBOOK)
    args = ap.parse_args(argv)
    _utf8_stdout()

    quotes = load_quotes(args.rulebook)

    if args.self_test:
        return self_test(quotes)

    if args.why:
        print("metrics and the rulebook sections they come from")
        for key, label, section in METRICS:
            q = quotes.get(section)
            print("\n  %s  (%s)" % (key, label))
            print("    section: %s" % section)
            print("    quote:   %s" % (("\"%s\"" % q[:200]) if q else "NOT FOUND in rulebook"))
        return 0

    if not args.files:
        ap.print_usage()
        return 2

    gates = {}
    for item in [x.strip() for x in args.fail_on.split(",") if x.strip()]:
        if "=" in item:
            k, v = item.split("=", 1)
            gates[k.strip()] = float(v)
        else:
            gates[item] = 0.0
    unknown = [k for k in gates if k not in dict((m[0], m) for m in METRICS)]
    if unknown:
        print("unknown metric(s): %s" % ", ".join(unknown), file=sys.stderr)
        return 2

    failed = False
    for path in args.files:
        try:
            with open(path, encoding="utf-8") as f:
                text = f.read()
        except OSError as e:
            print("  skip %s (%s)" % (path, e))
            continue
        vals = measure(text, args.include_quoted)
        print_report(path, vals, quotes, args.why)
        for k, limit in gates.items():
            if vals[k] > limit:
                print("    OVER: %s = %s (limit %s)" % (k, vals[k], limit))
                failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
