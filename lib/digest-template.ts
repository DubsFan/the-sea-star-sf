/**
 * Pure function to render a monthly digest email.
 * Matches existing mailer dark theme (#06080d bg, #c9a54e gold).
 * No external deps.
 */

export interface DigestItem {
  title: string
  excerpt: string
  image_url?: string
  url?: string
  type: 'blog' | 'event'
  date?: string
}

export function renderDigestHtml(opts: {
  subject: string
  intro: string
  items: DigestItem[]
  siteName?: string
}): string {
  const { subject, intro, items, siteName = 'The Sea Star' } = opts

  const itemsHtml = items.map((item, i) => {
    const imageBlock = item.image_url
      ? `<img src="${item.image_url}" alt="${item.title}" style="width:100%;max-height:220px;object-fit:cover;border-radius:4px;margin-bottom:12px;" />`
      : ''
    const badge = item.type === 'event'
      ? `<span style="display:inline-block;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c9a54e;background:rgba(201,165,78,0.1);padding:2px 8px;border-radius:3px;margin-bottom:8px;">Event</span><br/>`
      : ''
    const dateLine = item.date
      ? `<p style="font-size:12px;color:#5a6a7e;margin:0 0 6px;">${item.date}</p>`
      : ''
    const cta = item.url
      ? `<a href="${item.url}" style="display:inline-block;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a54e;text-decoration:none;border-bottom:1px solid rgba(201,165,78,0.4);padding-bottom:2px;margin-top:8px;">Read More &rarr;</a>`
      : ''
    const divider = i < items.length - 1
      ? `<div style="border-top:1px solid rgba(201,165,78,0.1);margin:24px 0;"></div>`
      : ''

    return `${imageBlock}
      ${badge}
      <h3 style="font-size:18px;color:#e8e0d0;margin:0 0 6px;font-weight:400;">${item.title}</h3>
      ${dateLine}
      <p style="font-size:14px;color:#7a8a9e;line-height:1.6;margin:0;">${item.excerpt}</p>
      ${cta}
      ${divider}`
  }).join('\n')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#06080d;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;color:#c9a54e;margin:0;font-weight:400;letter-spacing:2px;">${siteName.toUpperCase()}</h1>
      <p style="font-size:11px;color:#7a8a9e;letter-spacing:4px;margin:8px 0 0;text-transform:uppercase;">Dogpatch, San Francisco</p>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <h2 style="font-size:22px;color:#e8e0d0;margin:0 0 12px;font-weight:400;">${subject}</h2>
    </div>
    ${intro ? `<p style="font-size:14px;color:#9aa8b8;line-height:1.7;margin:0 0 28px;text-align:center;">${intro}</p>` : ''}
    <div style="border:1px solid rgba(201,165,78,0.15);padding:24px;margin-bottom:24px;">
      ${itemsHtml}
    </div>
    <div style="text-align:center;padding-top:24px;border-top:1px solid rgba(201,165,78,0.1);">
      <p style="font-size:11px;color:#4a5a6e;margin:0;">The Sea Star &middot; 2289 3rd Street &middot; San Francisco, CA</p>
      <p style="font-size:11px;color:#4a5a6e;margin:8px 0 0;"><a href="%unsubscribe_url%" style="color:#4a5a6e;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
}
