import RegisterScreen from "@/components/RegisterScreen";

type Props = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const lockedReferralCode = ref?.trim() || null;
  return <RegisterScreen lockedReferralCode={lockedReferralCode} />;
}
