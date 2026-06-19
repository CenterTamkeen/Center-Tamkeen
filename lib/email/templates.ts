const defaultSiteUrl = "https://center-tamkeen.com";
const defaultLogoUrl =
  "https://res.cloudinary.com/dabyu6chc/image/upload/v1781796565/tamkeen-transparent_gw04kk.png";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSiteUrl(siteUrl?: string) {
  return (
    siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    defaultSiteUrl
  ).replace(/\/$/, "");
}

function getLogoUrl() {
  const logoUrl = process.env.EMAIL_LOGO_URL?.trim();
  return logoUrl || defaultLogoUrl;
}

function renderEmailShell({
  title,
  eyebrow,
  preview,
  body,
  siteUrl,
}: {
  title: string;
  eyebrow: string;
  preview: string;
  body: string;
  siteUrl?: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeEyebrow = escapeHtml(eyebrow);
  const safePreview = escapeHtml(preview);
  const safeSiteUrl = escapeHtml(getSiteUrl(siteUrl));
  const safeLogoUrl = escapeHtml(getLogoUrl());

  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${safeTitle}</title>
    <style>
      @media only screen and (max-width: 640px) {
        .email-page-padding {
          padding: 16px 10px !important;
        }

        .email-container {
          width: 100% !important;
          max-width: 100% !important;
          border-radius: 18px !important;
        }

        .email-header {
          padding: 24px 18px 18px !important;
        }

        .email-content-wrap {
          padding: 0 14px 22px !important;
        }

        .email-card-cell {
          padding: 18px 14px !important;
        }

        .email-title {
          font-size: 23px !important;
          line-height: 1.55 !important;
        }

        .email-logo {
          width: 104px !important;
          max-width: 104px !important;
        }

        .email-button-table {
          width: 100% !important;
        }

        .email-button-link {
          display: block !important;
          padding: 13px 14px !important;
          text-align: center !important;
        }

        .email-link-box {
          font-size: 12px !important;
          line-height: 1.8 !important;
          padding: 12px !important;
        }
      }
    </style>
  </head>
  <body dir="rtl" style="margin:0; padding:0; background:#f5faf8; color:#0d251f; font-family:Cairo, Tahoma, Arial, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; line-height:1px;">
      ${safePreview}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f5faf8" style="width:100%; background:#f5faf8;">
      <tr>
        <td class="email-page-padding" align="center" style="padding:32px 14px;">
          <table class="email-container" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%; max-width:620px; overflow:hidden; border:1px solid #d0e3da; border-radius:24px; background:#ffffff; box-shadow:0 18px 45px rgba(13,37,31,0.08);">
            <tr>
              <td style="height:6px; background:#168a75; background-image:linear-gradient(90deg,#57b9a3,#f5c518,#168a75); font-size:0; line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td class="email-header" style="padding:30px 28px 22px; text-align:center; background:#ffffff;">
                <a href="${safeSiteUrl}" style="display:inline-block; text-decoration:none; margin:0 auto 14px;">
                  <img class="email-logo" src="${safeLogoUrl}" width="132" alt="" border="0" style="display:block; width:132px; max-width:132px; height:auto; border:0; outline:none; text-decoration:none; margin:0 auto;">
                </a>
                <div style="font-size:14px; font-weight:800; color:#168a75; letter-spacing:0; margin:0 0 8px;">${safeEyebrow}</div>
                <h1 class="email-title" style="margin:0; color:#0d251f; font-size:28px; line-height:1.45; font-weight:900;">${safeTitle}</h1>
              </td>
            </tr>
            <tr>
              <td class="email-content-wrap" style="padding:0 28px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fbfefd" style="width:100%; border:1px solid #d0e3da; border-radius:18px; background:#fbfefd;">
                  <tr>
                    <td class="email-card-cell" align="right" style="padding:24px; text-align:right;">
                      ${body}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px; text-align:center; background:#ecf5f1; border-top:1px solid #d0e3da;">
                <p style="margin:0; color:#5f766f; font-size:13px; line-height:1.8;">
                  الرسالة دي اتبعت من منصة تمكين التعليمية. لو الطلب مش منك، تجاهل الرسالة بأمان.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function getPasswordResetEmailHtml(
  actionLink: string,
  siteUrl?: string,
) {
  const safeActionLink = escapeHtml(actionLink);

  return renderEmailShell({
    title: "تغيير كلمة مرور تمكين",
    eyebrow: "أمان الحساب",
    preview: "رابط آمن لاختيار كلمة مرور جديدة لحسابك على تمكين.",
    siteUrl,
    body: `
      <p style="margin:0 0 16px; color:#12352c; font-size:16px; line-height:1.9;">
        وصلنا طلب لتغيير كلمة مرور حسابك. اضغط على الزر التالي واختار كلمة مرور جديدة.
      </p>
      <table class="email-button-table" role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto;">
        <tr>
          <td align="center" style="border-radius:14px; background:#168a75; box-shadow:0 10px 24px rgba(22,138,117,0.22);">
            <a class="email-button-link" href="${safeActionLink}" style="display:inline-block; padding:14px 24px; color:#ffffff; text-decoration:none; font-size:16px; font-weight:900; border-radius:14px;">
              تغيير كلمة المرور
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 10px; color:#5f766f; font-size:14px; line-height:1.8;">
        لو الزر مش شغال، انسخ الرابط وافتحه في المتصفح:
      </p>
      <p class="email-link-box" dir="ltr" style="box-sizing:border-box; max-width:100%; margin:0; padding:14px; color:#0e5f52; background:#e7f5f1; border:1px solid #c5e8df; border-radius:12px; font-size:13px; line-height:1.7; overflow-wrap:anywhere; word-break:break-word; text-align:left;">
        ${safeActionLink}
      </p>
    `,
  });
}

export function getSignupCodeEmailHtml(
  code: string,
  ttlMinutes: number,
  siteUrl?: string,
) {
  const safeCode = escapeHtml(code);

  return renderEmailShell({
    title: "كود تفعيل حساب تمكين",
    eyebrow: "تأكيد البريد الإلكتروني",
    preview: `كود تفعيل حساب الطالب صالح لمدة ${ttlMinutes} دقائق.`,
    siteUrl,
    body: `
      <p style="margin:0 0 18px; color:#12352c; font-size:16px; line-height:1.9;">
        استخدم الكود التالي لإكمال إنشاء حساب الطالب على منصة تمكين.
      </p>
      <table role="presentation" width="320" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#e7f5f1" style="width:320px; max-width:100%; margin:22px auto; background:#e7f5f1; border:1px solid #c5e8df; border-radius:18px;">
        <tr>
          <td dir="ltr" align="center" style="padding:18px 16px; color:#083a32; font-size:34px; line-height:1.2; letter-spacing:8px; font-weight:900; font-family:Tahoma, Arial, sans-serif; text-align:center;">
            ${safeCode}
          </td>
        </tr>
      </table>
      <p style="margin:0; color:#5f766f; font-size:14px; line-height:1.8;">
        الكود صالح لمدة <strong style="color:#0d251f;">${ttlMinutes} دقائق</strong> فقط. متشاركش الكود مع أي حد.
      </p>
    `,
  });
}
