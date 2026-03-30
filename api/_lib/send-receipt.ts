import { Resend } from 'resend';

/**
 * Branded receipt + delivery email — sent by the Stripe webhook.
 * Single email: receipt, download, setup tips, Discord CTA, upsell.
 */

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@2kterrysmods.com';
const SITE_URL = process.env.SITE_URL || 'https://2kterrysmods.com';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

export interface ReceiptEmailData {
  customerEmail: string;
  customerName: string;
  skinPackName: string;
  amount: number;
  orderId: string;
  downloadToken: string;
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || 'Fam';
}

export async function sendReceiptEmail(data: ReceiptEmailData): Promise<void> {
  const resend = getResend();
  const downloadUrl = `${SITE_URL}/api/customer-download?token=${data.downloadToken}`;
  const shopUrl = `${SITE_URL}/#shop`;
  const discordUrl = 'https://discord.gg/fmx8F4Ue';
  const firstName = getFirstName(data.customerName);
  const orderRef = data.orderId.slice(0, 8).toUpperCase();
  const orderDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { error } = await resend.emails.send({
    from: `2K Terry's Mods <${FROM_EMAIL}>`,
    to: [data.customerEmail],
    subject: `You're locked in — ${data.skinPackName} is ready`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your mod is ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Preheader text (hidden, shows in inbox preview) -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; color: #0a0e1a;">
    ${firstName}, your ${data.skinPackName} download is ready. Grab it now and level up your 2K game.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a;">
    <tr>
      <td align="center" style="padding: 48px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- ============ HEADER ============ -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #f97316, #ea580c); -webkit-background-clip: text; padding: 0;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #fb923c; letter-spacing: -1px; text-transform: uppercase;">
                      2K Terry's Mods
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="font-size: 12px; color: #475569; letter-spacing: 3px; text-transform: uppercase;">Premium 2K Modifications</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ HERO CARD ============ -->
          <tr>
            <td style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; border: 1px solid #1e3a5f; overflow: hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Accent Bar -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #f97316, #f59e0b, #f97316);"></td>
                </tr>

                <tr>
                  <td style="padding: 40px 36px 32px;">

                    <!-- Greeting -->
                    <h2 style="margin: 0 0 6px; font-size: 26px; font-weight: 700; color: #f8fafc;">
                      You're locked in, ${firstName}
                    </h2>
                    <p style="margin: 0 0 32px; font-size: 16px; color: #94a3b8; line-height: 1.6;">
                      Your mod just dropped into your collection. Hit the button below to download and start dominating.
                    </p>

                    <!-- ======= DOWNLOAD BUTTON ======= -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 12px; box-shadow: 0 4px 24px rgba(249, 115, 22, 0.3);">
                                <a href="${downloadUrl}"
                                   target="_blank"
                                   style="display: inline-block; padding: 18px 56px; color: #ffffff; font-size: 17px; font-weight: 700; text-decoration: none; letter-spacing: 0.3px;">
                                  DOWNLOAD YOUR MOD
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 12px;">
                          <span style="font-size: 12px; color: #475569;">This link is yours forever — re-download anytime.</span>
                        </td>
                      </tr>
                    </table>

                    <!-- ======= ORDER RECEIPT ======= -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a; border-radius: 14px; border: 1px solid #1e293b;">
                      <tr>
                        <td style="padding: 24px 28px 8px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td colspan="2" style="padding-bottom: 16px; border-bottom: 1px solid #1e293b;">
                                <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 2px; text-transform: uppercase;">Order Receipt</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 14px 0 10px; color: #94a3b8; font-size: 14px;">Item</td>
                              <td style="padding: 14px 0 10px; color: #f1f5f9; font-size: 14px; font-weight: 600; text-align: right;">${data.skinPackName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 0 0 10px; color: #94a3b8; font-size: 14px;">Order</td>
                              <td style="padding: 0 0 10px; color: #94a3b8; font-size: 14px; text-align: right; font-family: monospace;">#${orderRef}</td>
                            </tr>
                            <tr>
                              <td style="padding: 0 0 10px; color: #94a3b8; font-size: 14px;">Date</td>
                              <td style="padding: 0 0 10px; color: #94a3b8; font-size: 14px; text-align: right;">${orderDate}</td>
                            </tr>
                            <tr>
                              <td colspan="2" style="border-top: 1px solid #1e293b;"></td>
                            </tr>
                            <tr>
                              <td style="padding: 14px 0 16px; color: #94a3b8; font-size: 14px; font-weight: 600;">Total Paid</td>
                              <td style="padding: 14px 0 16px; color: #fb923c; font-size: 22px; font-weight: 800; text-align: right;">$${data.amount.toFixed(2)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ QUICK START TIPS ============ -->
          <tr>
            <td style="padding-top: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; border: 1px solid #334155;">
                <tr>
                  <td style="padding: 28px 36px;">
                    <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #f8fafc;">
                      Quick Start
                    </h3>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 28px; vertical-align: top;">
                                <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; background-color: #f97316; color: #fff; font-size: 12px; font-weight: 700; border-radius: 6px;">1</span>
                              </td>
                              <td style="color: #cbd5e1; font-size: 14px; line-height: 1.5; padding-left: 8px;">
                                Download the ZIP file using the button above
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 28px; vertical-align: top;">
                                <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; background-color: #f97316; color: #fff; font-size: 12px; font-weight: 700; border-radius: 6px;">2</span>
                              </td>
                              <td style="color: #cbd5e1; font-size: 14px; line-height: 1.5; padding-left: 8px;">
                                Extract the files to your NBA 2K mods folder
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 28px; vertical-align: top;">
                                <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; background-color: #f97316; color: #fff; font-size: 12px; font-weight: 700; border-radius: 6px;">3</span>
                              </td>
                              <td style="color: #cbd5e1; font-size: 14px; line-height: 1.5; padding-left: 8px;">
                                Follow the included install guide — you're live in minutes
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ DISCORD CTA ============ -->
          <tr>
            <td style="padding-top: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a3e 0%, #1e293b 100%); border-radius: 16px; border: 1px solid #2d3a6d;">
                <tr>
                  <td style="padding: 28px 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #f8fafc;">
                            Join the Community
                          </h3>
                          <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                            Get early access to new drops, request custom mods, and connect with other 2K modders.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <a href="${discordUrl}"
                             target="_blank"
                             style="display: inline-block; padding: 12px 32px; background-color: #5865F2; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
                            Join Our Discord
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ BROWSE MORE ============ -->
          <tr>
            <td style="padding-top: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; border: 1px solid #334155;">
                <tr>
                  <td style="padding: 28px 36px; text-align: center;">
                    <p style="margin: 0 0 16px; font-size: 15px; color: #94a3b8;">
                      Looking for more heat? We drop new mods regularly.
                    </p>
                    <a href="${shopUrl}"
                       target="_blank"
                       style="display: inline-block; padding: 12px 36px; background-color: transparent; color: #fb923c; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; border: 2px solid #fb923c;">
                      Browse All Mods
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ FOOTER ============ -->
          <tr>
            <td align="center" style="padding: 40px 20px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 14px; font-weight: 700; color: #475569;">2K TERRY'S MODS</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="font-size: 13px; color: #334155;">
                      <a href="${SITE_URL}" style="color: #64748b; text-decoration: none;">2kterrysmods.com</a>
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      <a href="${discordUrl}" style="color: #64748b; text-decoration: none;">Discord</a>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <p style="margin: 0; font-size: 11px; color: #1e293b; line-height: 1.6;">
                      &copy; ${new Date().getFullYear()} 2K Terry's Mods. All sales are final. No refunds.<br>
                      You received this email because you made a purchase at 2kterrysmods.com.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(`Failed to send receipt email: ${error.message}`);
  }

  console.log(`Receipt email sent to ${data.customerEmail} for order ${data.orderId}`);
}
