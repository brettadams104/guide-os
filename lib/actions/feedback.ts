'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function submitFeedback({
  category,
  message,
}: {
  category: string
  message: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Save to Supabase
  const { error } = await supabase.from('feedback').insert({
    guide_id: user.id,
    email:    user.email,
    category,
    message,
  })
  if (error) return { error: error.message }

  // Email notification
  const apiKey = process.env.RESEND_API_KEY
  console.log('[Feedback] API key present:', !!apiKey)

  try {
    const resend = new Resend(apiKey)
    const { data, error: emailError } = await resend.emails.send({
      from:    'GuideStride <noreply@guidestride.com>',
      to:      'brett@guidestride.com',
      subject: `New ${category} from ${user.email ?? 'a guide'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
          <div style="background: #0f1f35; padding: 28px; text-align: center; border-radius: 12px 12px 0 0;">
            <img src="https://app.guidestride.com/logo.png" alt="GuideStride" width="80" height="80" style="border-radius: 10px; display: block; margin: 0 auto;" />
          </div>
          <div style="padding: 28px; background: #ffffff; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="margin: 0 0 4px; font-size: 20px;">New ${category}</h2>
            <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">Submitted via GuideStride</p>
            <p style="font-size: 14px; margin: 0 0 8px;"><strong>From:</strong> ${user.email ?? 'Unknown'}</p>
            <p style="font-size: 14px; margin: 0 0 20px;"><strong>Category:</strong> ${category}</p>
            <div style="background: #f1f5f9; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 4px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        </div>
      `,
    })
    if (emailError) console.error('[Feedback] Resend error:', emailError)
    else console.log('[Feedback] Email sent, id:', data?.id)
  } catch (e) {
    console.error('[Feedback] Exception:', e)
  }

  return { ok: true }
}
