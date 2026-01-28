# Email environment variables explained

## Do you need EMAIL_FROM and EMAIL_RECIPIENTS?

### EMAIL_FROM
- **What it does**: The "From" address for job-change alert emails.
- **Required?** **No.** If unset, we use `JobCheck <onboarding@resend.dev>`, which Resend provides for testing.
- **When to set it**: When you verify your own domain in Resend (e.g. `alerts@yourdomain.com`). Use `EMAIL_FROM=Your Name <alerts@yourdomain.com>`.

### EMAIL_RECIPIENTS
- **What it does**: Fallback list of recipients when a **contact has no email recipients** (e.g. added via main "Add Person" without recipients, or scheduled job checker).
- **Required?** **No for the test page.** On the test page, you always enter recipients per contact; those are stored and used. `EMAIL_RECIPIENTS` is only used when a contact has none.
- **When to set it**: If you use the main app or job checker for contacts that don’t have per-contact recipients, set `EMAIL_RECIPIENTS` as a comma‑separated list so those alerts still go somewhere.

### RESEND_API_KEY
- **Required?** **Yes** for sending email.
- Set this in your environment (e.g. Vercel) for production.

## Summary

| Variable         | Required? | Used for                         |
|------------------|----------|-----------------------------------|
| `RESEND_API_KEY` | Yes      | Sending email via Resend         |
| `EMAIL_FROM`     | No       | Optional custom "From" address   |
| `EMAIL_RECIPIENTS` | No     | Fallback when contact has no recipients |

For the **notification test page**, you only need `RESEND_API_KEY`. Recipients come from what you enter when creating the test contact.
