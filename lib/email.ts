// Transactional email via Resend (https://resend.com). No-ops unless
// RESEND_API_KEY is set, so the app runs fine before email is configured.
//   RESEND_API_KEY   – your Resend API key
//   EMAIL_FROM       – e.g. "SacredOps <onboarding@sacredops.app>" (domain must
//                      be verified in Resend)
//   APP_URL          – base URL the emails link to (default demo.sacredops.app)
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return false;
  const from = process.env.EMAIL_FROM || "SacredOps <onboarding@sacredops.app>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const APP = process.env.APP_URL || "https://demo.sacredops.app";
// Optional Stripe customer-portal login link (manage/cancel). Set PORTAL_URL.
const PORTAL = process.env.PORTAL_URL || "";

// "Subscription confirmed — set up your account" onboarding email.
export function welcomeEmailHtml(): string {
  const step = (n: number, title: string, body: string) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">
      <tr>
        <td width="40" valign="top"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="28" height="28" bgcolor="#20c454" style="width:28px;height:28px;border-radius:14px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#04231a;text-align:center;line-height:28px">${n}</td></tr></table></td>
        <td style="padding-left:14px"><div style="font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#f2f5f0;padding-bottom:4px">${title}</div><div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#b9c7bd">${body}</div></td>
      </tr>
    </table>`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#050705">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050705"><tr><td align="center" style="padding:26px 14px 40px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">
      <tr><td align="center" style="padding:10px 0 24px"><span style="font-family:Arial,sans-serif;font-size:24px;font-weight:bold;letter-spacing:2px;color:#f2f5f0">SACRED<span style="color:#20c454">OPS</span></span></td></tr>
      <tr><td style="background:#0a0f0b;border:1px solid #0a3d24;border-radius:10px;padding:36px 32px 28px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 16px"><tr><td align="center" style="width:60px;height:60px;background:rgba(22,166,69,.14);border:2px solid #16a645;border-radius:50%;font-family:Arial,sans-serif;font-size:28px;color:#20c454;line-height:60px">&#10003;</td></tr></table>
        <h1 style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:25px;line-height:1.25;color:#f2f5f0;font-weight:bold;text-align:center">Your subscription is confirmed</h1>
        <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#b9c7bd;text-align:center">Welcome to SacredOps — you're all set. Three quick steps to get your company and crew running.</p>
        ${step(1, "Create your company account", 'Tap the button below, choose <b style="color:#f2f5f0">Company</b>, and enter your details. You\'ll instantly get a unique <b style="color:#20c454">Company Code</b> — that\'s how your crew joins.')}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:4px auto 22px"><tr><td align="center" bgcolor="#16a645" style="background:#16a645;border-radius:6px"><a href="${APP}/login?mode=signup" target="_blank" style="display:inline-block;background:#16a645;padding:15px 40px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;border:2px solid #20c454">Create your account &rarr;</a></td></tr></table>
        ${step(2, "You're the admin — invite your team", 'Log in anytime with your <b style="color:#f2f5f0">email &amp; password</b>. From <b style="color:#f2f5f0">Admin &rarr; Team &amp; Roles</b> invite supervisors and manage your plan.')}
        ${step(3, "Add your crew", 'Share your <b style="color:#20c454">Company Code</b> with your workers. They open the login page, tap <b style="color:#f2f5f0">Worker</b>, and enter the code, their name, and a 4-digit PIN.')}
      </td></tr>
      <tr><td align="center" style="padding:24px 20px 0">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#8ea394">Log in anytime: <a href="${APP}/login" style="color:#20c454;text-decoration:none">${APP.replace("https://", "")}/login</a><br>Questions? <a href="mailto:support@sacredops.app" style="color:#20c454;text-decoration:none">support@sacredops.app</a>${PORTAL ? `<br>Manage or cancel: <a href="${PORTAL}" style="color:#20c454;text-decoration:none">your subscription</a>` : ""}</p>
        <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;color:#6f8175;text-transform:uppercase">Build Safer &nbsp;·&nbsp; Work Smarter</p>
      </td></tr>
    </table>
  </td></tr></table>
  </body></html>`;
}
