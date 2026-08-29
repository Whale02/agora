#!/usr/bin/env python3
"""Supervise one continuous Claude Code ``/goal`` run.

There is deliberately no wall-clock deadline, turn limit, iteration limit, or
fixed no-progress counter here. ``/goal`` owns continuation and decides whether
the completion condition is met or impossible. This process only restores the
same Claude session after a transient CLI/process failure, using files and git as
durable state across compaction and host restarts.

    python scripts/autonomous-loop.py --prompt .claude/prompt-run.md

Semantic stops are: the plan is complete, a repo-root ``STOP`` file exists, the
goal returns normally while the plan is still open, or an unrecoverable
authentication/billing/model-access failure prevents further work.
"""

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

# The run's output is UTF-8 and this console may be cp1252; without this, echoing
# one ⌘ kills the supervisor from the print side the way the pipe side once did.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass


UNRECOVERABLE_MARKERS = (
    "authentication failed",
    "authentication_error",
    "billing error",
    "billing_error",
    "credit balance",
    "insufficient credits",
    "invalid api key",
    "model not found",
    "model_not_found",
    "not logged in",
    "organization has been disabled",
)
SESSION_LOST_MARKERS = (
    "conversation not found",
    "no conversation found",
    "session not found",
)
RESUME_PROMPT = (
    "Continue the active goal. Re-read CLAUDE.md, PLAN.md, and PROGRESS.md "
    "before acting, then continue from durable state without narrowing scope."
)


def open_items(plan: Path) -> int:
    """Count unchecked Markdown task items, or fail for a missing plan."""
    if not plan.is_file():
        raise FileNotFoundError(f"plan file not found: {plan}")
    return sum(
        1
        for line in plan.read_text(encoding="utf-8", errors="replace").splitlines()
        if line.lstrip().startswith("- [ ]")
    )


def read_session(state_file: Path, prompt_fingerprint: str) -> str | None:
    try:
        state = json.loads(state_file.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        return None
    if state.get("prompt_fingerprint") != prompt_fingerprint:
        return None
    session_id = state.get("session_id")
    return session_id if isinstance(session_id, str) and session_id else None


def write_session(state_file: Path, session_id: str, prompt_fingerprint: str) -> None:
    state_file.write_text(
        json.dumps(
            {
                "session_id": session_id,
                "prompt_fingerprint": prompt_fingerprint,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def session_id_from(line: str) -> str | None:
    try:
        event = json.loads(line)
    except ValueError:
        return None
    session_id = event.get("session_id") if isinstance(event, dict) else None
    return session_id if isinstance(session_id, str) and session_id else None


def run_claude(
    *,
    repo: Path,
    goal: str,
    session_id: str | None,
    model: str,
    permission_mode: str,
    log_file: Path,
    state_file: Path,
    prompt_fingerprint: str,
) -> tuple[int, str, str | None]:
    prompt = RESUME_PROMPT if session_id else f"/goal {goal}"
    command = [
        "claude",
        "-p",
        prompt,
        "--model",
        model,
        "--permission-mode",
        permission_mode,
        "--output-format",
        "stream-json",
        "--verbose",
    ]
    if session_id:
        command.extend(["--resume", session_id])

    output_tail = ""
    discovered_session = session_id
    with log_file.open("w", encoding="utf-8") as log:
        process = subprocess.Popen(
            command,
            cwd=repo,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            # The CLI emits UTF-8; without this, Windows decodes the pipe as the
            # locale codepage (cp1252) and one multibyte glyph kills the reader.
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        assert process.stdout is not None
        try:
            for line in process.stdout:
                log.write(line)
                log.flush()
                print(line, end="", flush=True)
                output_tail = (output_tail + line.lower())[-100_000:]
                found = session_id_from(line)
                if found and found != discovered_session:
                    discovered_session = found
                    write_session(state_file, found, prompt_fingerprint)
            return process.wait(), output_tail, discovered_session
        except KeyboardInterrupt:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
            raise


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Supervise an unbounded Claude Code /goal run."
    )
    parser.add_argument(
        "--prompt", required=True, help="file containing the /goal completion condition"
    )
    parser.add_argument("--plan", default="PLAN.md")
    parser.add_argument("--model", default="opus")
    parser.add_argument(
        "--permission-mode",
        default="auto",
        help="auto by default; use broader permissions only in a disposable sandbox",
    )
    parser.add_argument("--repo", default=".")
    parser.add_argument(
        "--fresh",
        action="store_true",
        help="discard only the saved Claude session pointer and begin this goal afresh",
    )
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    prompt_file = Path(args.prompt)
    if not prompt_file.is_absolute():
        prompt_file = repo / prompt_file
    plan = Path(args.plan)
    if not plan.is_absolute():
        plan = repo / plan

    if not repo.is_dir():
        print(f"repository directory not found: {repo}", file=sys.stderr)
        return 2
    if not prompt_file.is_file():
        print(f"prompt file not found: {prompt_file}", file=sys.stderr)
        return 2
    try:
        remaining = open_items(plan)
    except FileNotFoundError as error:
        print(error, file=sys.stderr)
        return 2

    goal = prompt_file.read_text(encoding="utf-8")
    prompt_fingerprint = hashlib.sha256(goal.encode("utf-8")).hexdigest()
    log_dir = repo / ".loop-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    state_file = log_dir / "session-state.json"
    if args.fresh:
        state_file.unlink(missing_ok=True)
    session_id = read_session(state_file, prompt_fingerprint)

    if (repo / "STOP").exists():
        print("STOP file present; leaving the resumable session untouched")
        return 0
    if remaining == 0:
        state_file.unlink(missing_ok=True)
        print("PLAN.md has no open items; goal is already complete")
        return 0
    if shutil.which("claude") is None:
        print("claude executable not found on PATH", file=sys.stderr)
        return 2

    failures = 0
    while True:
        if (repo / "STOP").exists():
            print("STOP file present; leaving the resumable session untouched")
            return 0

        attempt = failures + 1
        stamp = time.strftime("%Y%m%d-%H%M%S")
        log_file = log_dir / f"{stamp}-attempt-{attempt:04d}.jsonl"
        mode = f"resume {session_id}" if session_id else "new /goal"
        print(f"Starting {mode}; {open_items(plan)} plan items remain; log {log_file.name}")

        try:
            code, output, discovered_session = run_claude(
                repo=repo,
                goal=goal,
                session_id=session_id,
                model=args.model,
                permission_mode=args.permission_mode,
                log_file=log_file,
                state_file=state_file,
                prompt_fingerprint=prompt_fingerprint,
            )
        except KeyboardInterrupt:
            print("\nInterrupted; rerun the command to resume this session", file=sys.stderr)
            return 130

        if discovered_session:
            session_id = discovered_session
        remaining = open_items(plan)
        if (repo / "STOP").exists():
            print("STOP file present; leaving the resumable session untouched")
            return 0
        if remaining == 0:
            state_file.unlink(missing_ok=True)
            print("Goal complete: PLAN.md has no open items")
            return 0

        if any(marker in output for marker in UNRECOVERABLE_MARKERS):
            print(
                f"Unrecoverable Claude access failure; {remaining} items remain. "
                f"See {log_file}",
                file=sys.stderr,
            )
            return code or 1

        if code == 0:
            print(
                f"/goal ended while {remaining} plan items remain. It concluded the goal "
                f"was impossible, fully blocked, or complete without satisfying PLAN.md. "
                f"See {log_file}; no blind relaunch was performed.",
                file=sys.stderr,
            )
            return 1

        if any(marker in output for marker in SESSION_LOST_MARKERS):
            session_id = None
            state_file.unlink(missing_ok=True)
            print("Saved Claude session is unavailable; restarting /goal from durable repo state")

        failures += 1
        delay = min(300, 5 * (2 ** min(failures - 1, 6)))
        print(
            f"Claude exited {code}; resuming after {delay}s. "
            "There is no retry-count or runtime limit.",
            file=sys.stderr,
        )
        time.sleep(delay)


if __name__ == "__main__":
    raise SystemExit(main())
