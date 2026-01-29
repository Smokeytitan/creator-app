import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
              <span className="text-display text-white text-2xl font-bold">P</span>
            </div>
            <h1 className="text-display text-3xl text-[var(--color-text-primary)] tracking-tight">
              Polygon Analytics
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Creator Intelligence Platform
          </p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-xl',
              },
            }}
            routing="virtual"
            afterSignUpUrl="/"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[var(--color-text-tertiary)]">
          <p>Create an account to submit content and track your campaigns</p>
        </div>
      </div>
    </div>
  );
}
