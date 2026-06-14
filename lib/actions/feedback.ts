'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const NOTIFY_EMAIL = 'brett@guidestride.com'

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

  // Send email notification
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from:    'GuideStride Feedback <feedback@guidestride.com>',
        to:      NOTIFY_EMAIL,
        subject: `[${category}] from ${user.email ?? 'a guide'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #0f1f35; margin-bottom: 4px;">New ${category}</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 0;">GuideStride · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #475569; font-size: 14px;"><strong>From:</strong> ${user.email ?? 'Unknown'}</p>
            <p style="color: #475569; font-size: 14px;"><strong>Category:</strong> ${category}</p>
            <div style="background: #f8fafc; border-left: 3px solid #0ea5e9; padding: 16px; border-radius: 4px; margin-top: 16px;">
              <p style="color: #1e293b; font-size: 15px; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `,
      })
    } catch {
      // Email failing shouldn't block the user — feedback is already saved to Supabase
    }
  }

  return { ok: true }
}
