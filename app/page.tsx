import { redirect } from 'next/navigation'

// Redirige la raíz al dashboard
export default function Home() {
  redirect('/dashboard')
}
