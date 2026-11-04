<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Webhook verification is browser-only Web Crypto with mock tenant secrets, so this simulator never requires real credentials or server calls.
- Keep immutable completed request snapshots per tenant in dashboard state; inspector edits are separate drafts and only resend creates a new run.
- When no completed request exists, the inspector creates its own tenant-scoped in-memory default draft, never a completed run or audit row, so inspection does not process a payment.
