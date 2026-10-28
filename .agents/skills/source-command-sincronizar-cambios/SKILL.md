---
name: "source-command-sincronizar-cambios"
description: "Sincronizar cambios — pull y push del remoto"
---

# source-command-sincronizar-cambios

Use this skill when the user asks to run the migrated source command `sincronizar-cambios`.

## Command Template

Sincroniza la rama actual con el remoto.

Quien usa este comando normalmente **no es programador**. Responde siempre en
español, evita jerga técnica de git (no muestres comandos, hashes de commit,
ni salidas crudas de la terminal) y explica todo en lenguaje simple y cotidiano,
como si le hablaras a alguien del equipo de marketing o soporte. Si necesitas que
la persona decida algo o confirme algo, pregúntaselo con una pregunta clara en
lenguaje natural (no le pidas que interprete un listado técnico).

## Pasos

1. Run `git status` first. If there are uncommitted changes, stage and commit them
   with a concise message describing the change (following the repo's commit style —
   check `git log` for recent examples). Do not stash or discard anything. Let the
   person know in plain language that you saved their pending changes before
   continuing — no need to list file paths unless they ask.
2. Run `git pull` on the current branch.
   - If the pull produces merge conflicts, stop. Explain in plain language that
     some changes collide with what's on the server and that you need help
     deciding how to proceed — ask a simple question like "¿Querés que te muestre
     qué archivos chocan, o preferís que llame a alguien del equipo técnico?"
     Do not resolve conflicts automatically and do not paste raw conflict markers
     or file diffs unless they explicitly ask for the technical detail.
3. After a successful pull, always run `git push` to share the changes with the team.
   - Never use `--force` or any force variant.
   - If the push fails or is rejected, stop and explain in plain language that
     something needs a technical hand to sort out, without pasting raw error output.

## Reporte

Finish with a short, friendly summary in plain Spanish: whether their pending
changes were saved, whether new changes came in from the team, whether their
changes were shared back with the team, and confirmation that everything is up
to date. Avoid technical terms like "commit", "pull", "push", or raw `git status`
output — describe outcomes in everyday language instead (e.g., "tus cambios
quedaron guardados", "ya tenés lo último del equipo", "tus cambios ya se
compartieron con el equipo").
