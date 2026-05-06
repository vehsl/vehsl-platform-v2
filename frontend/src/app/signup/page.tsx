import { SignupFlow } from "@/components/signup/SignupFlow";

export const metadata = { title: "Sign up · Vehsl" };

export default function SignupPage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-white">
      <SignupFlow />
    </div>
  );
}
