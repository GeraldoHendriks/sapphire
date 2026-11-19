<p align="center">
  <img src="./assets/sapphire/icon-192.png" width="80" height="80" alt="Sapphire logo" />
</p>

<h1 align="center">Sapphire</h1>

<p align="center">An agent-first code editor, built on <a href="https://github.com/pingdotgg/t3code">T3 Code</a>.</p>

Sapphire keeps everything T3 Code does well: the agents, the threads and the sidebar workflow. It
replaces the interface with two clear modes per thread:

- **Chat**, where the agent works.
- **Review**, where you check and test that work. The diff, pull request, browser or simulator,
  and terminal sit side by side.

Line comments, GitHub-style review verdicts, a dock composer and quick edits by hand make Review
the place where you steer the agent.

See [SAPPHIRE.md](./SAPPHIRE.md) for what Sapphire changes and how it stays in step with T3 Code.

## Run it

Sapphire uses [Vite+](https://viteplus.dev/guide/). Install its `vp` command, then from the
repository root:

```sh
vp i
vp run dev
```

Open the pairing URL that the dev runner prints. See
[docs/operations/development.md](./docs/operations/development.md) for more.

## Credits

Sapphire is a fork of [T3 Code](https://github.com/pingdotgg/t3code) by Theo, Julius and the
T3 Code contributors, released under the same [license](./LICENSE).
