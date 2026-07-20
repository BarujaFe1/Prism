# Release checklist — Prism

Use before tagging a GitHub Release.

## Gates

- [ ] CI green on the release commit (`lint`, `typecheck`, `test`, `build`)
- [ ] `npm audit` reviewed (no forced breaking Next downgrade)
- [ ] `git status` clean; no `*.db` / `.env` staged
- [ ] CHANGELOG updated with **facts only**

## Product

- [ ] Demo seed works: `DATABASE_URL=file:demo.db npm run demo:seed`
- [ ] Demo mode blocks PATCH/sync: `PRISM_DEMO_MODE=1`
- [ ] README claims match code (Node version, connectors, watchlist wording, no fake deploy URL)
- [ ] Screenshots/docs assets are current **or** explicitly marked as placeholders

## Tag

```bash
git tag -a v0.x.y -m "Prism v0.x.y"
git push origin v0.x.y
gh release create v0.x.y --notes-file CHANGELOG.md
```

Do not publish a release claiming production multi-tenant readiness.
