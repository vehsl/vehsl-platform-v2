import { SignupFlow } from "@/components/signup/SignupFlow";
import { LanguageToggle } from "@/components/common/LanguageToggle";

export const metadata = { title: "Sign up · Vehsl" };

export default function SignupPage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-white">
      <div className="absolute right-6 top-6 z-50">
        <LanguageToggle />
      </div>
      <SignupFlow />
    </div>
  );
}
