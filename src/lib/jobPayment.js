import { supabase } from './supabase'

export async function completeJobAndReleasePayment({ jobId, workerId, amount, jobTitle }) {
  if (!jobId) throw new Error('Missing job id')
  if (!workerId) throw new Error('No worker is assigned to this job yet')

  // Marking complete triggers the DB function `release_payment_on_completion`
  // (SECURITY DEFINER) which auto-creates the wallet if needed, credits the
  // worker, logs the transaction, and sends a notification.
  const { data: updatedJob, error: jobError } = await supabase
    .from('job_posts')
    .update({ status: 'completed' })
    .eq('id', jobId)
    .neq('status', 'completed')
    .select('id, payment_amount')
    .single()

  if (jobError || !updatedJob) {
    throw new Error('This job is already completed or cannot be completed now')
  }

  return { payoutAmount: Number(amount ?? updatedJob.payment_amount ?? 0) }
}
