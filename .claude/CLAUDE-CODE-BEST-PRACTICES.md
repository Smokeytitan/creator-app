# Claude Code Best Practices Reference

> A comprehensive guide to working effectively with Claude Code, compiled from official documentation and community best practices.

---

## 🎯 Foundational Tips

### Clear Task Framing & Instruction Structure
**50. Clear Task Framing** - State exactly what you want Claude to do before anything else.

**49. Front Load Instructions** - Always put the most important instruction at the very top of the prompt.

**47. Prompt Structure** - Use this effective structure:
```
[Role] + [Task] + [Context]
```

Example:
```
As a senior React developer, refactor the Campaigns component to use
dynamic data calculations instead of hardcoded values. The component
currently shows stats at the top that are hardcoded to "2", "9", etc.
```

### Verification & Testing
**48. Give Claude a way to verify its work** - Include tests, screenshots, or expected outputs so Claude can check itself. This is the single highest-leverage thing you can do.

**46. Chrome Extension Tip** - UI changes can be verified using the Claude Chrome extension. It opens a browser, tests the UI, and iterates until the code works.

### Context Management
**44. Provide specific context in your prompts** - The more precise your instructions, the better. Claude can only infer context.

**43. Assume Zero Context** - Assume Claude knows nothing about your project. Tell it everything it needs to know.

**42. Rich Context** - Use `@` to link files, data, and images.

**41. Claude.MD Tip** - Run `/init` to generate a starter CLAUDE.md file for your current project.

---

## 📋 Workflow: Explore → Plan → Code

**45. Explore first, then plan, then code**
1. **Research** - Use Explore agent or other LLMs to understand the problem space
2. **Enter Plan Mode** - Design your approach with `/plan`
3. **Execute** - Switch back to normal mode to write code

---

## 🗂️ Projects & Skills

### Project-Level Organization
**40. Project Instructions** - Use project-level instructions (CLAUDE.md) to define long-term behavior instead of repeating prompts.

**39. Project Memory** - Edit the "Memory" tab to control exactly what Claude should retain or ignore over time.

**35. Project Hygiene** - Regularly prune memory, files, and instructions to avoid drift.

**34. Project Context Bleed** - Separate projects for unrelated workstreams to prevent context bleed.

**31. Project Memory Location** - Project memory can be stored in either `./CLAUDE.md` or `./.claude/CLAUDE.md`.

### Skills System
**38. Claude Skills** - Use them to turn repeatable workflows into Skills instead of re-prompting.

**37. Skill From Examples** - Paste a great output and ask Claude to turn it into a reusable Skill. You can even upload screenshots and ask Claude to replicate it.

**36. Skill Versioning** - Duplicate and version Skills as you refine workflows instead of editing live ones.

### Resources
**33. Claude Skills Repo** - A library of 80,000+ Claude Skills
- https://skillsmp.com/

**32. Claude Skills Library** - A cool website with plug-and-play Skills
- https://mcpservers.org/claude-skills

---

## 💡 Underrated Mini Tips

### Advanced Strategies
**30. Model Stacking** - Use other LLMs to plan your projects and generate advanced mega prompts before ever opening Claude Code. This strategy also saves tokens from Plan Mode.

**29. Create custom subagents** - Define specialized assistants in `.claude/agents/` that Claude can delegate to for isolated tasks.

**28. Output Scoring** - Ask Claude to score its answer against your pre-defined success criteria.

**25. Claude Interviews** - For larger projects, have Claude interview you first. Start with a minimal prompt and ask Claude to interview you using the AskUserQuestion tool.

### Tools & Plugins
**27. Install Plugins** - Run `/plugin` to browse the marketplace. Plugins add skills, tools, and integrations without any configuration.

**26. Claude Code taught IN Claude Code** - A course that teaches you Claude Code directly IN Claude Code.
- https://ccforeveryone.com/

### Session Management
**24. Correct Often** - Course-correct Claude often. The moment it starts going off track, stop (ESC to stop Claude mid-action).

**23. Clear** - Run `/clear` to start a clean session.

**22. Rewind** - Double-tap ESC or `/rewind` to open checkpoint menu.

**21. Run Multiple Sessions** - Two main ways to run parallel sessions:
- **Claude Desktop**: Manage multiple local sessions visually. Each session gets its own isolated worktree.
- **Claude Web**: Run on Anthropic's secure cloud infrastructure in isolated VMs.

---

## 🐛 Debugging, Error Handling, Common Failure Patterns

### Debugging Strategies
**20. Step Isolation** - Re-run only the broken step instead of regenerating everything.

**19. Error Reproduction** - Ask Claude to intentionally reproduce the failure to understand it.

**18. Rollback Prompts** - Revert to the last known good prompt and reapply changes one at a time.

**14. Step-by-Step Replay** - Have Claude walk through how it generated the answer line by line.

**12. Debugging Project** - Create an AI project dedicated to debugging code (Grok 4 Heavy is good at debugging).

### Common Failure Patterns & Fixes

#### ❌ Problem: Over-Specified CLAUDE.md
**17. Over-Specified CLAUDE.md** - If your CLAUDE.md is too long, Claude ignores half of it because important rules get lost in the noise.

**Fix**: Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook.

#### ❌ Problem: Context Pollution from Task Switching
**16. Don't make this mistake** - You start with one task, then ask Claude something unrelated, then go back to the first task. Context is full of irrelevant information.

**Fix**: `/clear` between unrelated tasks.

#### ❌ Problem: Over-Correcting
**15. Over-Correcting** - Claude does something wrong, you correct it, it's still wrong, you correct again. Context is polluted with failed approaches.

**Fix**: After two failed corrections, `/clear` and write a better initial prompt incorporating what you learned.

#### ❌ Problem: The Infinite Exploration
**13. The infinite exploration** - You ask Claude to "investigate" something without scoping it. Claude reads hundreds of files, filling the context.

**Fix**: Scope investigations narrowly or use subagents so the exploration doesn't consume your main context.

### Context Window Management
**11. Context Window Management** - Claude's context window fills up fast. As this happens, Claude may start forgetting earlier instructions.

**Resources**:
- https://code.claude.com/docs/en/costs#reduce-token-usage

---

## 🎓 Learning Resources

**10. Notion Database** - Connect your Notion database to Claude to store your best & most commonly used prompts.

**9. Learn Claude Code in Action** - Anthropic's learning resources:
- https://www.anthropic.com/learn

**8. Claude Courses** - Courses from Coursera:
- https://www.anthropic.com/learn

**7. Boris' Setup** - How the creator of Claude Code maximises Claude Code:
- Boris' Claude Code Setup Cheatsheet

**6. Claude Code Best Practices (DOC)** - Link to the latest doc:
- https://code.claude.com/docs/en/best-practices

**3. Claude Superpowers** - A GitHub Repo of Claude Code superpowers:
- https://github.com/obra/superpowers

**1. How to Extend Claude Code** - Anthropic's Guide:
- https://code.claude.com/docs/en/features-overview

---

## ⚡ Advanced Features

**5. Safe Autonomous Mode** - Use `claude --dangerously-skip-permissions` to bypass all permission checks and let Claude work uninterrupted. This works well for workflows like fixing lint errors or generating boilerplate code.

**4. Slow & Steady** - Take your time. Especially if building a serious workflow. Plan. Plan. Plan. THEN, execute.

---

## 📝 Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `/init` | Generate starter CLAUDE.md file |
| `/clear` | Start a clean session |
| `/rewind` | Open checkpoint menu |
| `/plugin` | Browse plugin marketplace |
| `/plan` | Enter plan mode |
| `ESC` | Stop Claude mid-action |
| `ESC ESC` | Open rewind menu |

---

## 🎯 My Personal Workflow Checklist

### Before Starting a Task
- [ ] Is this a research task or implementation task?
- [ ] Do I need to `/clear` from the previous unrelated task?
- [ ] Have I provided enough context (@files, screenshots, test criteria)?
- [ ] Is my instruction front-loaded and specific?

### During Execution
- [ ] Am I course-correcting Claude when it goes off track?
- [ ] Have I tried more than 2 corrections? (If yes → `/clear` and reframe)
- [ ] Is the exploration scoped narrowly enough?
- [ ] Can I verify Claude's work (tests, screenshots, expected output)?

### For Complex Tasks
- [ ] Should I use the Explore agent first?
- [ ] Should I enter Plan Mode?
- [ ] Can I create a custom skill for this workflow?
- [ ] Should I use a subagent for isolated work?

### After Completion
- [ ] Update project memory if needed
- [ ] Create/update a skill if this workflow is reusable
- [ ] Prune CLAUDE.md if it's getting cluttered

---

## 🔥 Top 5 Most Important Takeaways

1. **Give Claude a way to verify its work** - Tests, screenshots, expected outputs
2. **Context management is everything** - `/clear` between unrelated tasks
3. **Explore → Plan → Code** - Research, design, then execute
4. **Scope explorations narrowly** - Don't let Claude read hundreds of files
5. **After 2 failed corrections, `/clear` and reframe** - Don't pollute context

---

*Last Updated: 2026-01-23*
