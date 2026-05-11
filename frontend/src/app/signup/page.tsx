import { SignupFlow } from "@/components/signup/SignupFlow";
import { LanguageToggle } from "@/components/common/LanguageToggle";

export const metadata = { title: "Sign up · Vehsl" };

export default function SignupPage() {
  return (
    <div className="min-h-dvh h-dvh w-full overflow-x-hidden bg-white">
      <div className="absolute right-3 top-3 z-50 sm:right-6 sm:top-6">
        <LanguageToggle />
      </div>
      <SignupFlow />
    </div>
  );
}
