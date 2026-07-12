export async function sendEmail({ to, subject, text }) {
  return { mock: true, to, subject, text };
}
