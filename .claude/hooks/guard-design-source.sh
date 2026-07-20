#!/usr/bin/env bash
# PreToolUse guard: block Edit/Write/MultiEdit against the read-only Claude Design
# handoff (project/) and the local .design-source/ copy. Those are reference only —
# the app is implemented under src/. Exit 2 tells Claude Code to deny the tool call
# and feeds the stderr message back to the model.

input="$(cat)"
path="$(
  printf '%s' "$input" | node -e '
    let d = "";
    process.stdin.on("data", (c) => (d += c)).on("end", () => {
      try {
        const j = JSON.parse(d);
        const i = j.tool_input || {};
        process.stdout.write(i.file_path || i.path || "");
      } catch (e) {}
    });
  ' 2>/dev/null
)"

case "$path" in
  */project/* | project/* | */.design-source/* | .design-source/*)
    echo "Blocked: \"$path\" is inside the read-only design source (the Claude Design handoff in project/). It is reference material — implement changes under src/ instead." >&2
    exit 2
    ;;
esac

exit 0
