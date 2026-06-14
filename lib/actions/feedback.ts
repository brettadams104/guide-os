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

  // Email notification to Brett
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from:    'GuideStride <noreply@guidestride.com>',
    to:      'brett@guidestride.com',
    subject: `New ${category} from ${user.email ?? 'a guide'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="margin: 0 0 4px;">New ${category}</h2>
        <p style="margin: 0 0 20px; color: #64748b; font-size: 14px;">GuideStride Feedback</p>
        <p style="font-size: 14px; margin: 0 0 6px;"><strong>From:</strong> ${user.email ?? 'Unknown'}</p>
        <p style="font-size: 14px; margin: 0 0 20px;"><strong>Category:</strong> ${category}</p>
        <div style="background: #f1f5f9; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 4px;">
          <p style="margin: 0; font-size: 15px; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `,
  })

  if (emailError) console.error('[Feedback] Email error:', emailError)

  return { ok: true }
}
