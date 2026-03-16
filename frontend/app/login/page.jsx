import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ui/ClientOnly';

const LoginPageClient = dynamic(() => import('../../components/LoginPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  )
});

export default function LoginPage() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <LoginPageClient />
    </ClientOnly>
  );
}