# Skills

Installed from [thananon/9arm-skills](https://github.com/thananon/9arm-skills) on 2026-07-20.

Each subfolder is a Claude Code skill (a `SKILL.md` with `name` + `description` frontmatter); Claude auto-loads the relevant one by task.

| Skill | Use it for |
| --- | --- |
| `debug-mantra` | Disciplined debugging: reproduce → trace → falsify → cross-reference |
| `post-mortem` | Write the RCA once a bug is fixed & validated |
| `scrutinize` | Outsider end-to-end review of a plan / PR / change |
| `qwen-agent` | Delegate menial tasks to a cheap Qwen subagent (needs the `claude-9arm` gateway) |
| `management-talk` | Rewrite engineer content for leadership / a specific channel |
| `qwenchance` | Keep long tasks on-track — break loops, watch context, hand off cleanly |

> `qwen-agent` depends on an external `claude-9arm` alias/gateway that is not configured in this repo; the others work as-is.
